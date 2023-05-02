package dev.dsf.fhir.profiles;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;

import org.hl7.fhir.r4.model.ActivityDefinition;
import org.hl7.fhir.r4.model.ActivityDefinition.ActivityDefinitionKind;
import org.hl7.fhir.r4.model.CanonicalType;
import org.hl7.fhir.r4.model.Coding;
import org.hl7.fhir.r4.model.Enumerations.PublicationStatus;
import org.hl7.fhir.r4.model.Extension;
import org.hl7.fhir.r4.model.Identifier;
import org.hl7.fhir.r4.model.Resource;
import org.hl7.fhir.r4.model.StringType;
import org.junit.ClassRule;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.uhn.fhir.validation.ValidationResult;
import dev.dsf.fhir.validation.ResourceValidator;
import dev.dsf.fhir.validation.ResourceValidatorImpl;
import dev.dsf.fhir.validation.ValidationSupportRule;

public class ActivityDefinitionProfileTest
{
	private static final Logger logger = LoggerFactory.getLogger(EndpointProfileTest.class);

	@ClassRule
	public static final ValidationSupportRule validationRule = new ValidationSupportRule(
			Arrays.asList("dsf-activity-definition-0.5.0.xml", "dsf-extension-process-authorization-0.5.0.xml",
					"dsf-extension-process-authorization-consortium-role-0.5.0.xml",
					"dsf-extension-process-authorization-organization-0.5.0.xml",
					"dsf-coding-process-authorization-local-all-0.5.0.xml",
					"dsf-coding-process-authorization-local-consortium-role-0.5.0.xml",
					"dsf-coding-process-authorization-local-organization-0.5.0.xml",
					"dsf-coding-process-authorization-remote-all-0.5.0.xml",
					"dsf-coding-process-authorization-remote-consortium-role-0.5.0.xml",
					"dsf-coding-process-authorization-remote-organization-0.5.0.xml"),
			Arrays.asList("dsf-read-access-tag-0.5.0.xml", "dsf-organization-role-0.6.0.xml",
					"dsf-process-authorization-0.5.0.xml"),
			Arrays.asList("dsf-read-access-tag-0.5.0.xml", "dsf-organization-role-0.6.0.xml",
					"dsf-process-authorization-recipient-0.5.0.xml", "dsf-process-authorization-requester-0.5.0.xml"));

	private ResourceValidator resourceValidator = new ResourceValidatorImpl(validationRule.getFhirContext(),
			validationRule.getValidationSupport());

	private ActivityDefinition createActivityDefinition()
	{
		var ad = new ActivityDefinition();
		ad.getMeta().addProfile("http://dsf.dev/fhir/StructureDefinition/activity-definition");
		ad.getMeta().addTag().setSystem("http://dsf.dev/fhir/CodeSystem/read-access-tag").setCode("ALL");
		ad.setUrl("http://dsf.dev/bpe/Process/test");
		ad.setVersion("0.5.0");
		ad.setStatus(PublicationStatus.ACTIVE);
		ad.setKind(ActivityDefinitionKind.TASK);

		return ad;
	}

	private void logMessages(ValidationResult result)
	{
		result.getMessages().stream().map(m -> m.getLocationString() + " " + m.getLocationLine() + ":"
				+ m.getLocationCol() + " - " + m.getSeverity() + ": " + m.getMessage()).forEach(logger::debug);
	}

	private void logResource(Resource resource)
	{
		logger.trace("{}",
				validationRule.getFhirContext().newJsonParser().setPrettyPrint(false).encodeResourceToString(resource));
	}

	@Test
	public void testActivityDefinitionWithProcessAuthorizationRequesterRemoteAllRecipientLocalAllValid()
			throws Exception
	{
		ActivityDefinition ad = createActivityDefinition();
		Extension processAuthorization = ad.addExtension()
				.setUrl("http://dsf.dev/fhir/StructureDefinition/extension-process-authorization");
		processAuthorization.addExtension("message-name", new StringType("foo"));
		processAuthorization.addExtension("task-profile",
				new CanonicalType("http://bar.org/fhir/StructureDefinition/baz"));
		processAuthorization.addExtension("requester",
				new Coding("http://dsf.dev/fhir/CodeSystem/process-authorization", "REMOTE_ALL", null));
		processAuthorization.addExtension("recipient",
				new Coding("http://dsf.dev/fhir/CodeSystem/process-authorization", "LOCAL_ALL", null));

		logResource(ad);

		ValidationResult result = resourceValidator.validate(ad);

		logMessages(result);

		assertTrue(result.isSuccessful());
	}

	@Test
	public void testActivityDefinitionWithProcessAuthorizationRequesterRemoteOrganizationRecipientLocalConsortiumRoleValid()
			throws Exception
	{
		ActivityDefinition ad = createActivityDefinition();
		Extension processAuthorization = ad.addExtension()
				.setUrl("http://dsf.dev/fhir/StructureDefinition/extension-process-authorization");
		processAuthorization.addExtension("message-name", new StringType("foo"));
		processAuthorization.addExtension("task-profile",
				new CanonicalType("http://bar.org/fhir/StructureDefinition/baz"));

		Coding requesterCoding = new Coding("http://dsf.dev/fhir/CodeSystem/process-authorization",
				"REMOTE_ORGANIZATION", null);
		requesterCoding.addExtension(
				"http://dsf.dev/fhir/StructureDefinition/extension-process-authorization-organization",
				new Identifier().setSystem("http://dsf.dev/sid/organization-identifier").setValue("organization.com"));
		processAuthorization.addExtension("requester", requesterCoding);

		Coding recipientCoding = new Coding("http://dsf.dev/fhir/CodeSystem/process-authorization", "LOCAL_ROLE", null);
		Extension consortiumRole = recipientCoding.addExtension();
		consortiumRole
				.setUrl("http://dsf.dev/fhir/StructureDefinition/extension-process-authorization-consortium-role");
		consortiumRole.addExtension("consortium",
				new Identifier().setSystem("http://dsf.dev/sid/organization-identifier").setValue("consortium.org"));
		consortiumRole.addExtension("role",
				new Coding("http://dsf.dev/fhir/CodeSystem/organization-role", "MeDIC", null));
		processAuthorization.addExtension("recipient", recipientCoding);

		logResource(ad);

		ValidationResult result = resourceValidator.validate(ad);

		logMessages(result);

		assertTrue(result.isSuccessful());
	}

	@Test
	public void testActivityDefinitionWithProcessAuthorizationRequesterRemoteOrganizationRecipientRemoteConsortiumRoleNotValid()
			throws Exception
	{
		ActivityDefinition ad = createActivityDefinition();
		Extension processAuthorization = ad.addExtension()
				.setUrl("http://dsf.dev/fhir/StructureDefinition/extension-process-authorization");
		processAuthorization.addExtension("message-name", new StringType("foo"));
		processAuthorization.addExtension("task-profile",
				new CanonicalType("http://bar.org/fhir/StructureDefinition/baz"));

		Coding requesterCoding = new Coding("http://dsf.dev/fhir/CodeSystem/process-authorization",
				"REMOTE_ORGANIZATION", null);
		requesterCoding.addExtension(
				"http://dsf.dev/fhir/StructureDefinition/extension-process-authorization-organization",
				new Identifier().setSystem("http://dsf.dev/sid/does-not-exists").setValue("organization.com"));
		processAuthorization.addExtension("requester", requesterCoding);

		Coding recipientCoding = new Coding("http://dsf.dev/fhir/CodeSystem/process-authorization", "REMOTE_ROLE",
				null);
		Extension consortiumRole = recipientCoding.addExtension();
		consortiumRole
				.setUrl("http://dsf.dev/fhir/StructureDefinition/extension-process-authorization-consortium-role");
		consortiumRole.addExtension("consortium",
				new Identifier().setSystem("http://dsf.dev/sid/organization-identifier").setValue("consortium.org"));
		consortiumRole.addExtension("role",
				new Coding("http://dsf.dev/fhir/CodeSystem/organization-role", "MeDIC", null));
		processAuthorization.addExtension("recipient", recipientCoding);

		logResource(ad);

		ValidationResult result = resourceValidator.validate(ad);

		logMessages(result);

		assertFalse(result.isSuccessful());
		assertEquals(25, result.getMessages().size());
	}
}