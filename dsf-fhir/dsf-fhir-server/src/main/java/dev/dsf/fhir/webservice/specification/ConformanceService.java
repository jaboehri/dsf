package dev.dsf.fhir.webservice.specification;

import dev.dsf.fhir.webservice.base.BasicService;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

public interface ConformanceService extends BasicService
{
	Response getMetadata(String mode, UriInfo uri, HttpHeaders headers);
}
