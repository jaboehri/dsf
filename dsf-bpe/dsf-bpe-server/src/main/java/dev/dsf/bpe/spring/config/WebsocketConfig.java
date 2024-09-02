package dev.dsf.bpe.spring.config;

import org.hl7.fhir.r4.model.QuestionnaireResponse;
import org.hl7.fhir.r4.model.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.dsf.bpe.subscription.ConcurrentSubscriptionHandlerFactory;
import dev.dsf.bpe.subscription.LocalFhirConnector;
import dev.dsf.bpe.subscription.LocalFhirConnectorImpl;
import dev.dsf.bpe.subscription.QuestionnaireResponseHandler;
import dev.dsf.bpe.subscription.QuestionnaireResponseSubscriptionHandlerFactory;
import dev.dsf.bpe.subscription.ResourceHandler;
import dev.dsf.bpe.subscription.SubscriptionHandlerFactory;
import dev.dsf.bpe.subscription.TaskHandler;
import dev.dsf.bpe.subscription.TaskSubscriptionHandlerFactory;

@Configuration
public class WebsocketConfig
{
	@Autowired
	private PropertiesConfig propertiesConfig;

	@Autowired
	private DaoConfig daoConfig;

	@Autowired
	private CamundaConfig camundaConfig;

	@Autowired
	private FhirConfig fhirConfig;

	@Autowired
	private FhirClientConfig fhirClientConfig;

	@Autowired
	private PluginConfig pluginConfig;

	@Bean
	public ResourceHandler<Task> taskHandler()
	{
		return new TaskHandler(camundaConfig.processEngine().getRepositoryService(),
				pluginConfig.processPluginManager(), fhirConfig.fhirContext(),
				camundaConfig.processEngine().getRuntimeService(),
				fhirClientConfig.clientProvider().getLocalWebserviceClient());
	}

	@Bean
	public SubscriptionHandlerFactory<Task> taskSubscriptionHandlerFactory()
	{
		return new ConcurrentSubscriptionHandlerFactory<>(propertiesConfig.getProcessStartOrContinueThreads(),
				new TaskSubscriptionHandlerFactory(taskHandler(), daoConfig.lastEventTimeDaoTask()));
	}

	@Bean
	public LocalFhirConnector fhirConnectorTask()
	{
		return new LocalFhirConnectorImpl<>(Task.class, fhirClientConfig.clientProvider(),
				taskSubscriptionHandlerFactory(), fhirConfig.fhirContext(),
				propertiesConfig.getTaskSubscriptionSearchParameter(), propertiesConfig.getWebsocketRetrySleepMillis(),
				propertiesConfig.getWebsocketMaxRetries());
	}

	@Bean
	public ResourceHandler<QuestionnaireResponse> questionnaireResponseHandler()
	{
		return new QuestionnaireResponseHandler(camundaConfig.processEngine().getRepositoryService(),
				pluginConfig.processPluginManager(), fhirConfig.fhirContext(),
				camundaConfig.processEngine().getTaskService());
	}

	@Bean
	public SubscriptionHandlerFactory<QuestionnaireResponse> questionnaireResponseSubscriptionHandlerFactory()
	{
		return new ConcurrentSubscriptionHandlerFactory<>(propertiesConfig.getProcessStartOrContinueThreads(),
				new QuestionnaireResponseSubscriptionHandlerFactory(questionnaireResponseHandler(),
						daoConfig.lastEventTimeDaoQuestionnaireResponse()));
	}

	@Bean
	public LocalFhirConnector fhirConnectorQuestionnaireResponse()
	{
		return new LocalFhirConnectorImpl<>(QuestionnaireResponse.class, fhirClientConfig.clientProvider(),
				questionnaireResponseSubscriptionHandlerFactory(), fhirConfig.fhirContext(),
				propertiesConfig.getQuestionnaireResponseSubscriptionSearchParameter(),
				propertiesConfig.getWebsocketRetrySleepMillis(), propertiesConfig.getWebsocketMaxRetries());
	}
}
