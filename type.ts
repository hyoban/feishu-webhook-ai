export interface RailwayWebhook {
  type: string
  timestamp: string
  project: Project
  environment: Environment
  deployment: Deployment
}

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface Environment {
  id: string
  name: string
}

export interface Deployment {
  id: string
  creator: Creator
  meta: Meta
}

export interface Creator {
  id: string
  name: string
  avatar: string
}

export interface Meta {}
