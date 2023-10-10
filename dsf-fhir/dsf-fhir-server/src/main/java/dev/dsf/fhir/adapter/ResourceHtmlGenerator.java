package dev.dsf.fhir.adapter;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.List;

import org.hl7.fhir.r4.model.Resource;

public abstract class ResourceHtmlGenerator
{
	protected static final SimpleDateFormat DATE_TIME_DISPLAY_FORMAT = new SimpleDateFormat("dd.MM.yyyy HH:mm:ss");

	protected String getServerBaseUrlPath(String serverBaseUrl)
	{
		try
		{
			return new URL(serverBaseUrl).getPath();
		}
		catch (MalformedURLException e)
		{
			throw new RuntimeException(e);
		}
	}

	protected void writeMeta(Resource resource, OutputStreamWriter out) throws IOException
	{
		writeSectionHeader("Meta", out);
		out.write("<div class=\"meta\">\n");

		if (resource.getMeta().hasProfile())
		{
			List<String> profiles = resource.getMeta().getProfile().stream()
					.map(p -> p.getValue().replaceAll("\\|", " \\| ")).toList();
			writeRowWithListAndAdditionalRowClasses("Profiles", profiles, "profiles", out);
		}

		if (resource.getMeta().hasLastUpdated())
		{
			writeRowWithAdditionalRowClasses("Last Updated",
					DATE_TIME_DISPLAY_FORMAT.format(resource.getMeta().getLastUpdated()), "last-updated", out);
		}

		out.write("</div>\n");

		if (resource.hasId())
		{
			writeRowWithAdditionalTextClasses("ID", resource.getIdElement().getIdPart(), "id-value", out);
		}
	}

	protected void writeSectionHeader(String text, OutputStreamWriter out) throws IOException
	{
		out.write("<h2 class=\"section-header\">" + text + "</h2>");
	}

	protected void writeRow(String label, String text, OutputStreamWriter out) throws IOException
	{
		writeRowWithAdditionalRowClassesAndTextClasses(label, text, null, null, out);
	}

	protected void writeRowWithAdditionalRowClasses(String label, String text, String additionalRowClasses,
			OutputStreamWriter out) throws IOException
	{
		writeRowWithAdditionalRowClassesAndTextClasses(label, text, additionalRowClasses, null, out);
	}

	protected void writeRowWithAdditionalTextClasses(String label, String text, String additionalTextClasses,
			OutputStreamWriter out) throws IOException
	{
		writeRowWithAdditionalRowClassesAndTextClasses(label, text, null, additionalTextClasses, out);
	}

	protected void writeRowWithAdditionalRowClassesAndTextClasses(String label, String text,
			String additionalRowClasses, String additionalTextClasses, OutputStreamWriter out) throws IOException
	{
		out.write("<div class=\"row" + getAdditionalElementStartingWithWhitespace(additionalRowClasses) + "\">\n");
		out.write("<label class=\"row-label\">" + label + "</label>\n");
		out.write("<div class=\"row-text" + getAdditionalElementStartingWithWhitespace(additionalTextClasses) + "\">"
				+ text + "</div>\n");
		out.write("</div>\n");
	}

	protected void writeRowWithLink(String label, String path, String id, OutputStreamWriter out) throws IOException
	{
		String href = path + "/" + id;
		String text = "<a href=\"" + href + "\">" + id + "</a>";
		writeRowWithAdditionalTextClasses(label, text, "id-value", out);
	}

	protected void writeRowWithList(String label, List<String> texts, OutputStreamWriter out) throws IOException
	{
		writeRowWithListAndAdditionalRowClasses(label, texts, null, out);
	}

	protected void writeRowWithListAndAdditionalRowClasses(String label, List<String> texts,
			String additionalRowClasses, OutputStreamWriter out) throws IOException
	{
		out.write("<div class=\"row" + getAdditionalElementStartingWithWhitespace(additionalRowClasses) + "\">\n");
		out.write("<label class=\"row-label\">" + label + "</label>\n");
		out.write("<ul class=\"row-list\">");

		for (String text : texts)
			out.write("<li class=\"row-text\">" + text + "</li>\n");

		out.write("</ul>");
		out.write("</div>\n");
	}

	private String getAdditionalElementStartingWithWhitespace(String element)
	{
		if (element != null && !element.isBlank())
			return " " + element;
		else
			return "";
	}
}