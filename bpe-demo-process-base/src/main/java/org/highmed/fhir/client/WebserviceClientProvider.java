package org.highmed.fhir.client;

import org.hl7.fhir.r4.model.IdType;

public interface WebserviceClientProvider
{
	String getLocalBaseUrl();

	WebserviceClient getLocalWebserviceClient();

	WebserviceClient getRemoteWebserviceClient(String baseUrl);

	WebserviceClient getRemoteWebserviceClient(IdType organizationReference);
}