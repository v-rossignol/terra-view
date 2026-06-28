export interface TechnicAction {
  label: string;
  href: string;
  external: boolean;
  presentation?: 'button';
}

export interface TechnicEntry {
  title: string;
  message: string;
  actions: TechnicAction[];
}
