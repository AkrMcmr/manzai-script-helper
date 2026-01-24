export interface Character {
  name: string;
  personality: string;
  speechStyle: string;
  catchphrase?: string;
}

export interface CombiConfig {
  combiName: string;
  boke: Character;
  tsukkomi: Character;
}

export interface Idea {
  id: string;
  theme: string;
  angle: string;
  content: string[];
  tags: string[];
  createdAt: string;
  source: 'idea' | 'ogiri' | 'expand';
}

export interface ScriptMetadata {
  title: string;
  duration: string;
  created: string;
  tags: string[];
}

export interface ScriptLine {
  speaker: string;
  text: string;
  direction?: string;
}

export interface ScriptSection {
  name: string;
  lines: ScriptLine[];
}

export interface Script {
  metadata: ScriptMetadata;
  sections: ScriptSection[];
}

export interface AppConfig {
  dataDir: string;
  defaultCharacter: string;
}
