import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  createIntegrationEntity,
  createIntegrationRelationship,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../types';
import { createAPIClient } from '../client';

const step: IntegrationStep<IntegrationConfig> = {
  id: 'fetch-alerts',
  name: 'Fetch Alerts',
  types: ['feroot_alert', 'feroot_project_generated_alert'],
  async executionHandler({
    instance,
    jobState,
  }: IntegrationStepExecutionContext<IntegrationConfig>) {
    const apiClient = createAPIClient(instance.config);

    await apiClient.getProjectAlerts(
      async (alert) => {
        await jobState.addEntity(
          createIntegrationEntity({
            entityData: {
              source: alert,
              assign: {
                _type: 'feroot_alert',
                _class: 'Finding',
                _key: alert.id,
                id: alert.id,
                name: alert.alertType || 'unknown-alert',
                category: 'Feroot Alert',
                severity: 'major',
                reportable: true,

                displayName: alert.title,
                eventsCount: alert.eventsCount,
                open: alert.state === 1,
              },
            },
          }),
        );
        await jobState.addRelationship(
          createIntegrationRelationship({
            _class: 'GENERATED',
            fromKey: alert.projectUuid,
            fromType: 'feroot_project',
            toKey: alert.id,
            toType: 'feroot_alert',
          }),
        );
      },
      {
        activeOnly: !instance.config.includeResolvedAlerts,
      },
    );
  },
};

export default step;
