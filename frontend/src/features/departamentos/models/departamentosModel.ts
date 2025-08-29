export interface Departamento {
  id?: number ;
  name: string;
  recebe_os: boolean;
  usuarios?: Array<string>;
  vistorias?: Array<string>;
  checklist?: Array<string>;
  ordensServicos?: Array<string>;
}
