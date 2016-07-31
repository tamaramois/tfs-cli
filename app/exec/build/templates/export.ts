import { TfCommand, CoreArguments } from "../../../lib/tfcommand";
import buildContracts = require('vso-node-api/interfaces/BuildInterfaces');
import args = require("../../../lib/arguments");
import trace = require('../../../lib/trace');
import Q = require("q");
import fs = require("fs");

export function getCommand(args: string[]): ExportTemplate {
    return new ExportTemplate(args);
}

export interface ExportTemplateArguments extends CoreArguments {
    templateId: args.StringArgument
    templatePath: args.StringArgument
    overwrite: args.BooleanArgument
}

export class ExportTemplate extends TfCommand<ExportTemplateArguments, buildContracts.BuildDefinitionTemplate> {
    protected description = "Export a build template to a local file";

    protected getHelpArgs(): string[] {
        return ["project", "templateId", "templatePath", "overwrite"];
    }

    protected setCommandArgs(): void {
        super.setCommandArgs();

        this.registerCommandArgument("templateId", "Build Template ID", "Identifies a Build Template.", args.StringArgument, null);
        this.registerCommandArgument("templatePath", "Template Path", "Local path to a Build Template.", args.FilePathsArgument,null);
        this.registerCommandArgument("overwrite", "Overwrite?", "Overwrite existing Build Template.", args.BooleanArgument, "false");
    }

    public exec(): Q.Promise<buildContracts.BuildDefinitionTemplate> {
        var api = this.webApi.getQBuildApi(this.connection.getCollectionUrl());

        return Q.all<number | string | boolean>([
            this.commandArgs.project.val(),
            this.commandArgs.templateId.val(),
            this.commandArgs.templatePath.val(),
            this.commandArgs.overwrite.val(),
        ]).spread((project, templateId, templatePath, overwrite, revision) => {
            trace.debug("Retrieving build template %s...", templateId);
            return api.getTemplate(project, templateId).then((template) => {
                if (!templatePath) {
                    templatePath = template.name + '-' + template.id + '.json';                   
                }
                if (fs.existsSync(templatePath.toString()) && !overwrite) {
                    return <any>Q.reject(new Error("Build template file already exists"));
                }
                fs.writeFileSync(templatePath.toString(), JSON.stringify(template, null, '  '));
                return template;
            });
        });
    }

    public friendlyOutput(data: buildContracts.BuildDefinitionTemplate): void {
        trace.info('Build Template %s exported successfully', data.id);
    }
}
