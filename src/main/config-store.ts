import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DEFAULT_CONFIG, validateWorkspace } from '../shared/workspace';
import type { AppConfig } from '../shared/types';

export function validateConfig(input: unknown): AppConfig {
  if (!input || typeof input !== 'object') throw new Error('Configuração inválida.');
  const candidate = input as Record<string, unknown>;
  if (candidate.version !== 1) throw new Error('Versão de configuração incompatível.');
  if (typeof candidate.launchAtLogin !== 'boolean') throw new Error('Inicialização inválida.');
  if (candidate.targetDisplayId !== null && (!Number.isSafeInteger(candidate.targetDisplayId))) {
    throw new Error('Monitor inválido.');
  }
  return {
    ...validateWorkspace(candidate), version: 1,
    launchAtLogin: candidate.launchAtLogin,
    targetDisplayId: candidate.targetDisplayId as number | null,
  };
}

export class ConfigStore {
  readonly path: string;
  constructor(readonly directory: string) {
    mkdirSync(directory, { recursive: true });
    this.path = join(directory, 'workspace.json');
  }

  load(): { config: AppConfig; firstRun: boolean; warning: string | null } {
    if (!existsSync(this.path)) return { config: structuredClone(DEFAULT_CONFIG), firstRun: true, warning: null };
    try {
      return { config: validateConfig(JSON.parse(readFileSync(this.path, 'utf8'))), firstRun: false, warning: null };
    } catch {
      // Keep the original recoverable; never silently replace a broken configuration.
      const backup = join(this.directory, `workspace-recovery-${Date.now()}-${randomUUID()}.json`);
      renameSync(this.path, backup);
      return {
        config: structuredClone(DEFAULT_CONFIG), firstRun: false,
        warning: 'Não foi possível abrir o layout salvo. Uma cópia de recuperação foi preservada na pasta de dados do Mosaico.',
      };
    }
  }

  save(config: AppConfig): void {
    const checked = validateConfig(config);
    const temp = this.path + '.tmp';
    writeFileSync(temp, JSON.stringify(checked, null, 2) + '\n', { mode: 0o600, flush: true });
    renameSync(temp, this.path);
  }
}
