import { TfCommand, CoreArguments } from "../../../lib/tfcommand";
import buildContracts = require('vso-node-api/interfaces/BuildInterfaces');
import args = require("../../../lib/arguments");
import trace = require('../../../lib/trace');
import fs = require("fs");

export function getCommand(args: string[]): DefinitionQueueStatus {
    return new DefinitionQueueStatus(args);
}

export interface DefinitionQueueStatusArguments extends CoreArguments {
    definitionId: args.IntArgument
    status: args.StringArgument
}

export class DefinitionQueueStatus extends TfCommand<DefinitionQueueStatusArguments, buildContracts.DefinitionReference> {
    protected description = "Manage a build definition queue status";

    protected getHelpArgs(): string[] {
        return ["project", "definitionId", "status"];
    }

    protected setCommandArgs(): void {
        super.setCommandArgs();
        this.registerCommandArgument("definitionId", "Build Definition ID", "Identifies a build definition.", args.IntArgument, null);
        this.registerCommandArgument("status", "Build Definition queue status", "definition queue status (enabled / paused / disabled).", args.StringArgument, null);
    }

    public exec(): Promise<buildContracts.DefinitionReference> {
        var api = this.webApi.getBuildApi(this.connection.getCollectionUrl());

        return Promise.all<number | string | boolean>([
            this.commandArgs.project.val(),
            this.commandArgs.definitionId.val(),
            this.commandArgs.status.val(),
        ]).then((values) => {
            const [project, definitionId, status] = values;
            return api.getDefinition(definitionId as number, project as string).then((definition) => {
                var currentStatus = buildContracts.DefinitionQueueStatus[definition.queueStatus];
                if (!currentStatus){
                    currentStatus = buildContracts.DefinitionQueueStatus[0]
                }
                trace.info("build definition %s (current status is: %s)", definition.name, currentStatus);
                switch (status as string)
                {
                  case "enable" :
                    definition.queueStatus = 0;
                    trace.info("setting definition %s to %s",definition.name, buildContracts.DefinitionQueueStatus[definition.queueStatus])
                    break;
                  case "pause" :
                    definition.queueStatus = 1;
                    trace.info("setting definition %s to %s",definition.name, buildContracts.DefinitionQueueStatus[definition.queueStatus])
                    break;
                  case "disable" :
                    definition.queueStatus = 2;
                    trace.info("setting definition %s to %s",definition.name, buildContracts.DefinitionQueueStatus[definition.queueStatus])
                    break;
                 default : trace.error("queue status allowd values are: enable / pause / disable");
                } 
                return api.updateDefinition(definition,definition.id,definition.project.name);
            });
        });
    }

    public friendlyOutput(data: buildContracts.BuildDefinition): void {
        trace.println();
        trace.success('Build Definition %s %s successfully!',data.name, buildContracts.DefinitionQueueStatus[data.queueStatus]);
    }
}