export interface RailwayWebhook {
  type: string;
  project: Project;
  deployment: Deployment;
  environment: Environment;
  status: string;
  timestamp: string;
  service: Service;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Deployment {
  id: string;
  meta: Meta;
  creator: Creator;
}

export interface Meta {
  repo: string;
  branch: string;
  logsV2: boolean;
  commitHash: string;
  commitAuthor: string;
  commitMessage: string;
  rootDirectory: any;
  serviceManifest: ServiceManifest;
  nixpacksProviders: string[];
  fileServiceManifest: FileServiceManifest;
  propertyFileMapping: PropertyFileMapping;
}

export interface ServiceManifest {
  build: any[];
  deploy: any[];
}

export interface FileServiceManifest {}

export interface PropertyFileMapping {}

export interface Creator {
  id: string;
  name: string;
  avatar: string;
}

export interface Environment {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
}
