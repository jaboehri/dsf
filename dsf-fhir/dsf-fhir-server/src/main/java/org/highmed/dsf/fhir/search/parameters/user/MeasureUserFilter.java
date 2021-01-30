package org.highmed.dsf.fhir.search.parameters.user;

import org.highmed.dsf.fhir.authentication.User;

public class MeasureUserFilter extends AbstractMetaTagAuthorizationRoleUserFilter
{
	private static final String RESOURCE_COLUMN = "measure";

	public MeasureUserFilter(User user)
	{
		super(user, RESOURCE_COLUMN);
	}

	public MeasureUserFilter(User user, String resourceColumn)
	{
		super(user, resourceColumn);
	}
}
