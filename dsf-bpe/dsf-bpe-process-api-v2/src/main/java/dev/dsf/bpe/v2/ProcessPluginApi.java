package dev.dsf.bpe.v2;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

import ca.uhn.fhir.context.FhirContext;
import dev.dsf.bpe.v2.config.ProxyConfig;
import dev.dsf.bpe.v2.service.EndpointProvider;
import dev.dsf.bpe.v2.service.FhirWebserviceClientProvider;
import dev.dsf.bpe.v2.service.MailService;
import dev.dsf.bpe.v2.service.OrganizationProvider;
import dev.dsf.bpe.v2.service.QuestionnaireResponseHelper;
import dev.dsf.bpe.v2.service.ReadAccessHelper;
import dev.dsf.bpe.v2.service.TaskHelper;
import dev.dsf.bpe.v2.service.process.ProcessAuthorizationHelper;
import dev.dsf.bpe.v2.variables.Variables;

/**
 * Gives access to services available to process plugins. This api and all services excepted {@link Variables} can be
 * injected using {@link Autowired} into spring {@link Configuration} classes.
 *
 * @see ProcessPluginDefinition#getSpringConfigurations()
 */
public interface ProcessPluginApi
{
	ProxyConfig getProxyConfig();

	EndpointProvider getEndpointProvider();

	FhirContext getFhirContext();

	FhirWebserviceClientProvider getFhirWebserviceClientProvider();

	MailService getMailService();

	ObjectMapper getObjectMapper();

	OrganizationProvider getOrganizationProvider();

	ProcessAuthorizationHelper getProcessAuthorizationHelper();

	QuestionnaireResponseHelper getQuestionnaireResponseHelper();

	ReadAccessHelper getReadAccessHelper();

	TaskHelper getTaskHelper();

	Variables getVariables(DelegateExecution execution);
}