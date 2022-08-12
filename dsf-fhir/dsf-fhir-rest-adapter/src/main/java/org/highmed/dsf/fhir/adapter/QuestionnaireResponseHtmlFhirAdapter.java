package org.highmed.dsf.fhir.adapter;

import java.io.IOException;
import java.io.OutputStreamWriter;

import javax.ws.rs.ext.Provider;

import org.hl7.fhir.r4.model.BooleanType;
import org.hl7.fhir.r4.model.QuestionnaireResponse;
import org.hl7.fhir.r4.model.StringType;
import org.hl7.fhir.r4.model.Type;

import ca.uhn.fhir.context.FhirContext;

@Provider
public class QuestionnaireResponseHtmlFhirAdapter extends HtmlFhirAdapter<QuestionnaireResponse>
{
	private static final String CODESYSTEM_HIGHMED_BPMN_USER_TASK_VALUE_BUSINESS_KEY = "business-key";
	private static final String CODESYSTEM_HIGHMED_BPMN_USER_TASK_VALUE_USER_TASK_ID = "user-task-id";

	public QuestionnaireResponseHtmlFhirAdapter(FhirContext fhirContext, ServerBaseProvider serverBaseProvider)
	{
		super(fhirContext, serverBaseProvider, QuestionnaireResponse.class);
	}

	@Override
	protected String getInitialLang()
	{
		return "html";
	}

	@Override
	protected boolean isHtmlEnabled()
	{
		return true;
	}

	@Override
	protected void doWriteHtml(QuestionnaireResponse questionnaireResponse, OutputStreamWriter out) throws IOException
	{
		out.write("<form>");

		for (QuestionnaireResponse.QuestionnaireResponseItemComponent item : questionnaireResponse.getItem())
		{
			writeRow(item, out);
		}

		out.write("<div class=\"row row-submit\" id=\"submit-row\">\n");
		out.write(
				"<button type=\"button\" id=\"submit\" class=\"submit\" onclick=\"completeQuestionnaireResponse();\">Submit</button>\n");
		out.write("</div>\n");
		out.write("</form>\n");
	}

	private void writeRow(QuestionnaireResponse.QuestionnaireResponseItemComponent item, OutputStreamWriter out)
			throws IOException
	{
		String linkId = item.getLinkId();
		String style = display(linkId) ? "" : "style=\"display:none;\"";

		out.write("<div class=\"row\" id=\"" + linkId + "-row\"" + style + ">\n");
		out.write("<label for=\"" + linkId + "-label\">" + item.getText() + "</label>\n");
		writeFormInput(item.getAnswerFirstRep(), linkId, out);
		out.write("</div>\n");
	}

	private boolean display(String linkId)
	{
		return !(CODESYSTEM_HIGHMED_BPMN_USER_TASK_VALUE_BUSINESS_KEY.equals(linkId)
				|| CODESYSTEM_HIGHMED_BPMN_USER_TASK_VALUE_USER_TASK_ID.equals(linkId));
	}

	private void writeFormInput(QuestionnaireResponse.QuestionnaireResponseItemAnswerComponent answerPlaceholder,
			String linkId, OutputStreamWriter out) throws IOException
	{
		Type type = answerPlaceholder.getValue();

		if (type instanceof StringType)
		{
			String placeholder = ((StringType) type).getValue();
			out.write("<input type=\"text\" id=\"" + linkId + "\" name=\"" + linkId + "\" placeholder=\"" + placeholder
					+ "\"></input>\n");
		}
		else if (type instanceof BooleanType)
		{
			out.write("<div>\n");
			out.write("<label class=\"radio\"><input type=\"radio\" id=\"" + linkId + "\" name=\"" + linkId
					+ "\" value=\"true\"/>Yes</label>\n");
			out.write("<label class=\"radio\"><input type=\"radio\" id=\"" + linkId + "\" name=\"" + linkId
					+ "\" value=\"false\" checked/>No</label>\n");
			out.write("</div>\n");
		}
		else
		{
			throw new RuntimeException(
					"Answer type '" + type.getClass().getName() + "' in QuestionnaireResponse.item is not supported");
		}
	}
}
