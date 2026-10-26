import type { AppConfig, Direction, LayoutNode, Panel, Workspace } from './types';

export const MAX_PANELS = 256;
const MAX_URL_LENGTH = 4096;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

export const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  panels: [],
  layout: null,
  launchAtLogin: true,
  targetDisplayId: null,
};

/** Accept web pages only. The same guard is used for imports and navigation. */
export function normalizeUrl(input: string): string {
  if (typeof input !== 'string' || !input || input.length > MAX_URL_LENGTH) {
    throw new Error('Informe um endereço com até 4.096 caracteres.');
  }
  if (/[\s\u0000-\u001f\u007f\\]/u.test(input)) {
    throw new Error('O endereço não pode conter espaços ou barras invertidas.');
  }

  let candidate = input;
  if (!/^https?:\/\//i.test(input)) {
    const hostWithPort = /^(?:[^/:?#]+|\[[\da-f:]+\]):\d+(?:[/?#]|$)/i.test(input);
    if (input.startsWith('/') || input.includes('://') || (/^[a-z][a-z\d+.-]*:/i.test(input) && !hostWithPort)) {
      throw new Error('Use um endereço HTTP ou HTTPS.');
    }
    const isLocal = /^(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/?#]|$)/i.test(input);
    candidate = `${isLocal ? 'http' : 'https'}://${input}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('O endereço da página é inválido.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Use HTTP ou HTTPS, sem usuário e senha no endereço.');
  }
  if (url.href.length > MAX_URL_LENGTH) {
    throw new Error('O endereço excede o limite de 4.096 caracteres.');
  }
  return url.href;
}

export function createPanel(url: string, title?: string): Panel {
  const normalized = normalizeUrl(url);
  const label = title?.trim() || new URL(normalized).hostname;
  if (label.length > 160 || /[\u0000-\u001f\u007f]/u.test(label)) {
    throw new Error('O nome da página deve ter até 160 caracteres e uma única linha.');
  }
  return {
    id: globalThis.crypto.randomUUID(),
    title: label,
    url: normalized,
    zoomFactor: 1,
    reloadIntervalSec: 0,
  };
}

/** Split one leaf while preserving every other branch and its proportions. */
export function splitLeaf(
  tree: LayoutNode | null,
  panelId: string,
  newPanelId: string,
  direction: Direction,
  splitId: string,
): LayoutNode | null {
  if (!tree) return { type: 'leaf', panelId: newPanelId };
  if (tree.type === 'leaf') {
    return tree.panelId === panelId
      ? { type: 'split', id: splitId, direction, ratio: 0.5, first: tree, second: { type: 'leaf', panelId: newPanelId } }
      : tree;
  }
  const first = splitLeaf(tree.first, panelId, newPanelId, direction, splitId)!;
  const second = splitLeaf(tree.second, panelId, newPanelId, direction, splitId)!;
  return first === tree.first && second === tree.second ? tree : { ...tree, first, second };
}

/** Removing a panel promotes its sibling, leaving no empty gap in the monitor. */
export function removeLeaf(tree: LayoutNode | null, panelId: string): LayoutNode | null {
  if (!tree) return null;
  if (tree.type === 'leaf') return tree.panelId === panelId ? null : tree;
  const first = removeLeaf(tree.first, panelId);
  const second = removeLeaf(tree.second, panelId);
  if (!first) return second;
  if (!second) return first;
  return first === tree.first && second === tree.second ? tree : { ...tree, first, second };
}

/** Keep a divider usable and avoid zero-sized child pages. */
export function updateRatio(tree: LayoutNode | null, splitId: string, ratio: number): LayoutNode | null {
  if (!Number.isFinite(ratio)) throw new Error('A proporção da divisão é inválida.');
  if (!tree || tree.type === 'leaf') return tree;
  if (tree.id === splitId) return { ...tree, ratio: Math.max(MIN_RATIO, Math.min(MAX_RATIO, ratio)) };
  const first = updateRatio(tree.first, splitId, ratio)!;
  const second = updateRatio(tree.second, splitId, ratio)!;
  return first === tree.first && second === tree.second ? tree : { ...tree, first, second };
}

function record(value: unknown, description: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${description} inválido.`);
  return value as Record<string, unknown>;
}

function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z\d][a-z\d_-]{0,127}$/i.test(value)) {
    throw new Error('Identificador de página ou divisão inválido.');
  }
  return value;
}

/** Validate and copy an untrusted import/IPC payload; never retain its objects. */
export function validateWorkspace(input: unknown): Workspace {
  const source = record(input, 'Layout');
  if (!Array.isArray(source.panels) || source.panels.length > MAX_PANELS) {
    throw new Error(`O layout deve conter uma lista de até ${MAX_PANELS} páginas.`);
  }

  const panelIds = new Set<string>();
  const panels: Panel[] = source.panels.map((value) => {
    const panel = record(value, 'Página');
    const id = identifier(panel.id);
    if (panelIds.has(id)) throw new Error('O layout contém páginas com identificadores repetidos.');
    panelIds.add(id);
    if (typeof panel.title !== 'string' || panel.title.length > 160 || /[\u0000-\u001f\u007f]/u.test(panel.title)) {
      throw new Error('O nome da página deve ter até 160 caracteres e uma única linha.');
    }
    if (typeof panel.url !== 'string') throw new Error('Endereço da página inválido.');
    if (typeof panel.zoomFactor !== 'number' || !Number.isFinite(panel.zoomFactor) || panel.zoomFactor < 0.25 || panel.zoomFactor > 3) {
      throw new Error('O zoom deve estar entre 25% e 300%.');
    }
    if (typeof panel.reloadIntervalSec !== 'number' || !Number.isInteger(panel.reloadIntervalSec)
      || (panel.reloadIntervalSec !== 0 && (panel.reloadIntervalSec < 10 || panel.reloadIntervalSec > 86400))) {
      throw new Error('A atualização deve estar desativada ou entre 10 e 86.400 segundos.');
    }
    return { id, title: panel.title, url: normalizeUrl(panel.url), zoomFactor: panel.zoomFactor, reloadIntervalSec: panel.reloadIntervalSec };
  });

  if (source.layout === null) {
    if (panels.length) throw new Error('As páginas precisam estar associadas a divisões do monitor.');
    return { panels, layout: null };
  }

  const leafIds = new Set<string>();
  const splitIds = new Set<string>();
  const visited = new WeakSet<object>();
  let nodeCount = 0;

  function visit(value: unknown, depth: number): LayoutNode {
    if (depth > MAX_PANELS || ++nodeCount > MAX_PANELS * 2 - 1) {
      throw new Error('O layout excede o limite de divisões suportadas.');
    }
    const node = record(value, 'Divisão');
    if (visited.has(node)) throw new Error('O layout contém uma estrutura circular ou repetida.');
    visited.add(node);
    if (node.type === 'leaf') {
      const panelId = identifier(node.panelId);
      if (!panelIds.has(panelId)) throw new Error('Uma divisão referencia uma página inexistente.');
      if (leafIds.has(panelId)) throw new Error('Uma página aparece mais de uma vez no monitor.');
      leafIds.add(panelId);
      return { type: 'leaf', panelId };
    }
    if (node.type !== 'split') throw new Error('Tipo de divisão inválido.');
    const id = identifier(node.id);
    if (splitIds.has(id)) throw new Error('O layout contém divisões com identificadores repetidos.');
    splitIds.add(id);
    if (node.direction !== 'row' && node.direction !== 'column') throw new Error('Direção de divisão inválida.');
    if (typeof node.ratio !== 'number' || !Number.isFinite(node.ratio) || node.ratio < MIN_RATIO || node.ratio > MAX_RATIO) {
      throw new Error('A proporção da divisão deve estar entre 10% e 90%.');
    }
    return {
      type: 'split', id, direction: node.direction, ratio: node.ratio,
      first: visit(node.first, depth + 1), second: visit(node.second, depth + 1),
    };
  }

  const layout = visit(source.layout, 1);
  if (leafIds.size !== panelIds.size) throw new Error('Existem páginas que não estão posicionadas no monitor.');
  return { panels, layout };
}
