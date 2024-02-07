function startProcess() {
	const task = readTaskInputsFromForm()

	if (task) {
		const taskString = JSON.stringify(task)
		createTask(taskString)
	}
}

function readTaskInputsFromForm() {
	document.querySelectorAll("ul.error-list").forEach(ul => ul.replaceChildren())

	const task = getResourceAsJson()
	const newInputs = []
	var valid = true

	task.input.forEach(input => {
		if (input?.type?.coding[0]?.system !== undefined && input?.type?.coding[0]?.code !== undefined) {
			const id = input.type.coding[0].system + "|" + input.type.coding[0].code

			if (id !== "http://dsf.dev/fhir/CodeSystem/bpmn-message|message-name") {
				document.querySelectorAll(`div.row[for^="${CSS.escape(id)}"]`).forEach(row => {
					const result = readAndValidateTaskInput(input, row)

					if (result.input !== null)
						newInputs.push(result.input)
					else if (!result.optional)
						valid = false
				})
			} else {
				newInputs.push(input)
			}
		}
	})

	delete task["id"]
	delete task.meta["versionId"]
	delete task.meta["lastUpdated"]
	delete task["identifier"]

	// TODO set requester as practitioner-identifier if OIDC or Personal Client-Certificate
	//task.requester.type = "Practitioner"
	//task.requester.identifier.value = ""
	//task.requester.identifier.system = "http://dsf.dev/sid/practitioner-identifier"

	task.status = "requested"
	task.authoredOn = new Date().toISOString()
	task.input = newInputs

	return valid ? task : null
}

function readAndValidateTaskInput(input, row) {
	const htmlInputs = row.querySelectorAll("input[fhir-type]")
	const id = row.getAttribute("for")
	const optional = row.hasAttribute('optional')

	if (htmlInputs?.length === 1) {
		const inputFhirType = htmlInputs[0].getAttribute("fhir-type")

		if (inputFhirType === "Reference.reference")
			return newTaskInputReferenceReference(input.type, id, htmlInputs[0].value, optional)
		else
			return newTaskInputTyped(input.type, id, "value" + inputFhirType.charAt(0).toUpperCase() + inputFhirType.slice(1), htmlInputs[0].value, optional)
	}

	else if (htmlInputs?.length === 2) {
		const input0FhirType = htmlInputs[0].getAttribute("fhir-type")
		const input1FhirType = htmlInputs[1].getAttribute("fhir-type")

		if ("Coding.system" === input0FhirType && "Coding.code" === input1FhirType)
			return newTaskInputCoding(input.type, id, htmlInputs[0].value, htmlInputs[1].value, optional)
		else if ("Identifier.system" === input0FhirType && "Identifier.value" == input1FhirType)
			return newTaskInputIdentifier(input.type, id, htmlInputs[0].value, htmlInputs[1].value, optional)
		else if ("Reference.identifier.system" === input0FhirType && "Reference.identifier.value" == input1FhirType)
			return newTaskInputReferenceIdentifier(input.type, id, htmlInputs[0].value, htmlInputs[1].value, optional, input?.valueReference?.type)
		else if ("boolean.true" === input0FhirType && "boolean.false" == input1FhirType)
			return newTaskInputBoolean(input.type, id, htmlInputs[0].checked, htmlInputs[1].checked, optional)
	}

	return null
}

function newTaskInputReferenceReference(type, id, inputValue, optional) {
	const value = validateAndConvert(id, "valueReference", inputValue, optional, "Input")

	if (value !== null) {
		return {
			optional: optional,
			input: {
				type: type,
				valueReference: {
					reference: value
				}
			}
		}
	} else
		return { optional: optional, input: null }
}

function newTaskInputTyped(type, id, fhirType, inputValue, optional) {
	const value = validateAndConvert(id, fhirType, inputValue, optional, "Input")

	if (value !== null) {
		const input = {
			type: type
		}
		input[fhirType] = value
		
		return { optional: optional, input: input }
	} else
		return { optional: optional, input: null }
}

function newTaskInputCoding(type, id, system, code, optional) {
	const validated = validateCoding(id, system, code, optional, "Input")

	if (validated !== null) {
		return {
			optional: optional,
			input: {
				type: type,
				valueCoding: {
					system: validated.system,
					code: validated.code
				}
			}
		}
	} else
		return { optional: optional, input: null }
}

function newTaskInputIdentifier(type, id, system, value, optional) {
	const validated = validateIdentifier(id, system, value, optional, "Input")

	if (validated !== null) {
		return {
			optional: optional,
			input: {
				type: type,
				valueIdentifier: {
					system: validated.system,
					value: validated.value
				}
			}
		}
	} else
		return { optional: optional, input: null }
}

function newTaskInputReferenceIdentifier(type, id, system, value, optional, referenceType) {
	const validated = validateIdentifier(id, system, value, optional, "Input")

	if (validated !== null) {
		return {
			optional: optional,
			input: {
				type: type,
				valueReference: {
					type: referenceType,
					identifier: {
						system: validated.system,
						value: validated.value
					}
				}
			}
		}
	} else
		return { optional: optional, input: null }
}

function newTaskInputBoolean(type, id, checkedTrue, checkedFalse, optional) {
	const value = !checkedTrue && !checkedFalse ? null : checkedTrue

	if (!optional && value === null) {
		const errorListElement = document.querySelector(`ul[for="${CSS.escape(id)}"]`)
		addError(errorListElement, "Input mandatory")
	}

	if (value) {
		return {
			optional: optional,
			input: {
				type: type,
				valueBoolean: value
			}
		}
	}
	else
		return { optional: optional, input: null }
}

function completeQuestionnaireResponse() {
	const questionnaireResponse = readQuestionnaireResponseAnswersFromForm()

	if (questionnaireResponse) {
		const questionnaireResponseString = JSON.stringify(questionnaireResponse)
		updateQuestionnaireResponse(questionnaireResponseString)
	}
}

function readQuestionnaireResponseAnswersFromForm() {
	document.querySelectorAll("ul.error-list").forEach(ul => ul.replaceChildren())

	const questionnaireResponse = getResourceAsJson()
	const newItems = []
	var valid = true

	questionnaireResponse.item.forEach(item => {
		if (item?.linkId !== undefined && item?.answer !== undefined) {
			const id = item.linkId

			if (id !== "business-key" && id !== "user-task-id") {
				const result = readAndValidateQuestionnaireResponseItem(item, id)

				if (result)
					newItems.push(result)
				else
					valid = false
			} else {
				newItems.push(item)
			}
		}
	})

	questionnaireResponse.status = "completed"
	questionnaireResponse.item = newItems

	return valid ? questionnaireResponse : null
}

function readAndValidateQuestionnaireResponseItem(item, id) {
	const htmlInputs = document.querySelectorAll(`input[fhir-type][id^="${CSS.escape(id)}"]`)

	if (htmlInputs?.length === 1) {
		const inputFhirType = htmlInputs[0].getAttribute("fhir-type")

		if (inputFhirType === "Reference.reference")
			return newQuestionnaireResponseItemReferenceReference(item.text, id, htmlInputs[0].value, false)
		else
			return newQuestionnaireResponseItemTyped(item.text, id, "value" + inputFhirType.charAt(0).toUpperCase() + inputFhirType.slice(1), htmlInputs[0].value, false)
	}
	else if (htmlInputs?.length === 2) {
		const input0FhirType = htmlInputs[0].getAttribute("fhir-type")
		const input1FhirType = htmlInputs[1].getAttribute("fhir-type")

		if ("Coding.system" === input0FhirType && "Coding.code" === input1FhirType)
			return newQuestionnaireResponseItemCoding(item.text, id, htmlInputs[0].value, htmlInputs[1].value, false)
		else if ("Reference.identifier.system" === input0FhirType && "Reference.identifier.value" == input1FhirType)
			return newQuestionnaireResponseItemReferenceIdentifier(item.text, id, htmlInputs[0].value, htmlInputs[1].value, false)
		else if ("boolean.true" === input0FhirType && "boolean.false" == input1FhirType)
			return newQuestionnaireResponseItemBoolean(item.text, id, htmlInputs[0].checked, htmlInputs[1].checked, false)
	}

	return null
}

function newQuestionnaireResponseItemReferenceReference(text, id, inputValue, optional) {
	const value = validateAndConvert(id, "valueReference", inputValue, optional, "Item")

	if (optional && value === null) {
		return {
			linkId: id,
			text: text
		}
	}
	else if (value !== null) {
		const item = {
			linkId: id,
			text: text,
			answer: [{
				valueReference: {
					reference: value
				}
			}]
		}

		return item
	} else
		return null
}

function newQuestionnaireResponseItemTyped(text, id, fhirType, inputValue, optional) {
	const value = validateAndConvert(id, fhirType, inputValue, optional, "Item")

	if (optional && value === null) {
		return {
			linkId: id,
			text: text
		}
	}
	else if (value !== null) {
		const item = {
			linkId: id,
			text: text,
			answer: [{}]
		}
		item.answer[0][fhirType] = value

		return item
	} else
		return null
}

function newQuestionnaireResponseItemCoding(text, id, system, code, optional) {
	const validated = validateCoding(id, system, code, optional, "Item")

	if (validated !== null) {
		return {
			linkId: id,
			text: text,
			answer: [{
				valueCoding: {
					system: validated.system,
					code: validated.code
				}
			}]
		}
	} else
		return null
}

function newQuestionnaireResponseItemReferenceIdentifier(text, id, system, value, optional) {
	const validated = validateIdentifier(id, system, value, optional, "Item")

	if (validated !== null) {
		return {
			linkId: id,
			text: text,
			answer: [{
				valueReference: {
					identifier: {
						system: validated.system,
						value: validated.value
					}
				}
			}]
		}
	} else
		return null
}

function newQuestionnaireResponseItemBoolean(text, id, checkedTrue, checkedFalse, optional) {
	const value = !checkedTrue && !checkedFalse ? undefined : checkedTrue

	if (optional && value === undefined) {
		return {
			linkId: id,
			text: text
		}
	}
	else if (value !== undefined) {
		return {
			linkId: id,
			text: text,
			answer: [{
				valueBoolean: value
			}]
		}
	}
	else {
		const errorListElement = document.querySelector(`ul[for="${CSS.escape(id)}"]`)
		addError(errorListElement, "Item mandatory")
		return null
	}
}

function validateAndConvert(id, fhirType, inputValue, optional, valueName) {
	const errorListElement = document.querySelector(`ul[for="${CSS.escape(id)}"]`)

	if (fhirType === "valueString")
		return validateString(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueInteger")
		return validateInteger(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueDecimal")
		return validateDecimal(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueDate")
		return validateDate(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueTime")
		return validateTime(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueDateTime")
		return validateDateTime(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueInstant")
		return validateInstant(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueUri")
		return validateUrl(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueUrl")
		return validateUrl(errorListElement, inputValue, optional, valueName)
	else if (fhirType === "valueReference")
		return validateReference(errorListElement, inputValue, optional, valueName)
	else
		return undefined
}

function validateCoding(id, system, code, optional, valueName) {
	const systemEmpty = system === null || system.trim() === ""
	const codeEmpty = code === null || code.trim() === ""

	if (optional && systemEmpty && codeEmpty)
		return null

	else {
		const errorListElement = document.querySelector(`ul[for="${CSS.escape(id)}"]`)

		const validatedSystem = validateUrl(errorListElement, system, false, valueName + " system")
		const validatedCode = validateString(errorListElement, code, false, valueName + " code")

		if (validatedSystem !== null && validatedCode !== null)
			return {
				system: validatedSystem,
				code: validatedCode
			}
		else
			return null
	}
}

function validateIdentifier(id, system, value, optional, valueName) {
	const systemEmpty = system === null || system.trim() === ""
	const valueEmpty = value === null || value.trim() === ""

	if (optional && systemEmpty && valueEmpty)
		return null

	else {
		const errorListElement = document.querySelector(`ul[for="${CSS.escape(id)}"]`)

		const validatedSystem = validateUrl(errorListElement, system, false, valueName + " system")
		const validatedValue = validateString(errorListElement, value, false, valueName + " value")

		if (validatedSystem !== null && validatedValue !== null)
			return {
				system: validatedSystem,
				value: validatedValue
			}
		else
			return null
	}
}

function validateType(errorListElement, value, optional, valueName, typeValid, typeSpecificError, toType) {
	const stringValid = value !== null && value.trim() !== ""

	if (!optional && !stringValid) {
		addError(errorListElement, valueName + " mandatory")
		return null
	} else if (stringValid) {
		if (typeValid(value))
			return toType(value)
		else {
			addError(errorListElement, valueName + " " + typeSpecificError)
			return null
		}
	} else
		return null
}

function validateString(errorListElement, value, optional, valueName) {
	return validateType(errorListElement, value, optional, valueName, () => true, null, v => v)
}

function validateInteger(errorListElement, value, optional, valueName) {
	const integerValid = v => Number.isSafeInteger(parseInt(v)) && parseInt(v) == v

	return validateType(errorListElement, value, optional, valueName, integerValid, "not an integer", parseInt)
}

function validateDecimal(errorListElement, value, optional, valueName) {
	const decimalValid = v => !isNaN(parseFloat(v)) && parseFloat(v) == v

	return validateType(errorListElement, value, optional, valueName, decimalValid, "not a decimal", parseFloat)
}

function validateDate(errorListElement, value, optional, valueName) {
	const dateValid = v => !isNaN(new Date(v))

	return validateType(errorListElement, value, optional, valueName, dateValid, "is not a date", v => new Date(v).toISOString().substring(0, 10))
}

function validateTime(errorListElement, value, optional, valueName) {
	const timeValid = v => new RegExp("^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])(:[0-5]?[0-9])?$").test(v)

	return validateType(errorListElement, value, optional, valueName, timeValid, "is not a time", v => {
		v = v.split(":").length === 2 ? v + ":00" : v
		return v.split(":").map(v => v.padStart(2, "0")).join(":")
	})
}

function validateDateTime(errorListElement, value, optional, valueName) {
	// TODO precision YYYY, YYYY-MM, YYYY-MM-DD also valid

	const dateValid = v => !isNaN(new Date(v))

	return validateType(errorListElement, value, optional, valueName, dateValid, "is not a date-time", v => new Date(v).toISOString())
}

function validateInstant(errorListElement, value, optional, valueName) {
	const dateValid = v => !isNaN(new Date(v))

	return validateType(errorListElement, value, optional, valueName, dateValid, "is not a date-time", v => new Date(v).toISOString())
}

function validateReference(errorListElement, value, optional, valueName) {
	const urlValid = v => {
		try {
			new URL(v)
			return true
		} catch (_) {
			return false
		}
	}

	return validateType(errorListElement, value, optional, valueName, urlValid, "is not a reference", v => v)
}

function validateUrl(errorListElement, value, optional, valueName) {
	const urlValid = v => {
		try {
			new URL(v)
			return true
		} catch (_) {
			return false
		}
	}

	return validateType(errorListElement, value, optional, valueName, urlValid, "is not a url", v => v)
}

function addError(errorListElement, message) {
	const errorMessageElement = document.createElement("li")
	errorMessageElement.innerText = message
	errorListElement.appendChild(errorMessageElement)
}

function updateQuestionnaireResponse(questionnaireResponse) {
	const fullUrl = window.location.origin + window.location.pathname
	const requestUrl = fullUrl.indexOf("/_history") < 0 ? fullUrl : fullUrl.slice(0, fullUrl.indexOf("/_history"))
	const resourceBaseUrlWithoutId = fullUrl.slice(0, fullUrl.indexOf("/QuestionnaireResponse") + "/QuestionnaireResponse".length)

	enableSpinner()

	fetch(requestUrl, {
		method: "PUT",
		headers: {
			"Content-type": "application/json",
			"Accept": "application/json"
		},
		body: questionnaireResponse
	}).then(response => parseResponse(response, resourceBaseUrlWithoutId))
}

function createTask(task) {
	const fullUrl = window.location.origin + window.location.pathname
	const requestUrl = fullUrl.slice(0, fullUrl.indexOf("/Task") + "/Task".length)

	enableSpinner()

	fetch(requestUrl, {
		method: "POST",
		headers: {
			"Content-type": "application/json",
			"Accept": "application/json"
		},
		body: task
	}).then(response => parseResponse(response, requestUrl))
}

function parseResponse(response, resourceBaseUrlWithoutId) {
	response.text().then(text => {
		if (response.ok) {
			const resource = JSON.parse(text)
			setTimeout(() => {
				disableSpinner()
				window.location.href = resourceBaseUrlWithoutId + "/" + resource.id
			}, 1000)
		} else {
			disableSpinner()
			const statusText = response.statusText === null ? " - " + response.statusText : ""
			window.alert("Status: " + response.status + statusText + "\n\n" + text)
		}
	})
}

function enableSpinner() {
	const spinner = document.getElementById("spinner")
	spinner.classList.remove("spinner-disabled")
	spinner.classList.add("spinner-enabled")
}

function disableSpinner() {
	const spinner = document.getElementById("spinner")
	spinner.classList.remove("spinner-enabled")
	spinner.classList.add("spinner-disabled")
}

function adaptTaskFormInputs() {
	const resourceType = getResourceTypeForCurrentUrl()

	if (resourceType !== null && resourceType[1] !== undefined && resourceType[1] === "Task") {
		const task = getResourceAsJson()

		if (task.status === "draft" && task.meta !== null && task.meta.profile !== null && task.meta.profile.length > 0) {
			const profile = task.meta.profile[0]

			let currentUrl = window.location.origin + window.location.pathname
			let requestUrl = currentUrl.slice(0, currentUrl.indexOf("/Task")) + "/StructureDefinition?url=" + profile

			loadStructureDefinition(requestUrl).then(parseStructureDefinition)
		}
	}
}

function loadStructureDefinition(url) {
	return fetch(url, {
		method: "GET",
		headers: {
			"Accept": "application/json"
		}
	}).then(response => response.json())
}

function parseStructureDefinition(bundle) {
	if (bundle.entry.length > 0 && bundle.entry[0].resource != null) {
		const structureDefinition = bundle.entry[0].resource

		if (structureDefinition.differential != null) {
			const differentials = structureDefinition.differential.element
			const slices = filterInputSlices(differentials)
			const groupedSlices = groupBy(slices, d => d.id.split(".")[1])
			const definitions = getDefinitions(groupedSlices)

			definitions.forEach(modifyInputRow)
		}
	}
}

function filterInputSlices(differentials) {
	return differentials.filter(diff => diff.id.startsWith("Task.input:")
		&& !(diff.id.includes("message-name") || diff.id.includes("business-key")
			|| diff.id.includes("correlation-key")))
}

function groupBy(list, keyGetter) {
	const map = new Map()

	list.forEach(item => {
		const key = keyGetter(item)
		const collection = map.get(key)

		if (!collection) {
			map.set(key, [item])
		} else {
			collection.push(item)
		}
	})

	return Array.from(map.values())
}

function getDefinitions(groupedSlices) {
	return groupedSlices.map(differentials => {
		const valueType = getValueOfDifferential(differentials, "Task.input.value[x]", "type")

		return {
			identifier: window.location.href,
			typeSystem: getValueOfDifferential(differentials, "Task.input.type.coding.system", "fixedUri"),
			typeCode: getValueOfDifferential(differentials, "Task.input.type.coding.code", "fixedCode"),
			valueType: (valueType != undefined && valueType.length > 0) ? valueType[0].code : undefined,
			min: getValueOfDifferential(differentials, "Task.input", "min"),
			max: getValueOfDifferential(differentials, "Task.input", "max"),
		}
	})
}

function getValueOfDifferential(differentials, path, property) {
	const values = differentials.filter(d => d.path !== null && d.path === path)

	if (values.length > 0) {
		return values[0][property]
	} else {
		return undefined
	}
}

function modifyInputRow(definition) {
	const id = definition.typeSystem + "|" + definition.typeCode
	const row = document.querySelector(`div.row[for="${CSS.escape(id)}"]`)
	const span = row.querySelector('span.cardinalities')
	span.innerText = `[${definition.min}..${definition.max}]`

	if (definition.max !== "1") {
		const plusIcon = htmlToElement('<span class="plus-minus-icon"></span>')
		const plusIconSvg = htmlToElement('<svg height="20" width="20" viewBox="0 -960 960 960"><title>Add additional input</title><path d="M453-280h60v-166h167v-60H513v-174h-60v174H280v60h173v166Zm27.266 200q-82.734 0-155.5-31.5t-127.266-86q-54.5-54.5-86-127.341Q80-397.681 80-480.5q0-82.819 31.5-155.659Q143-709 197.5-763t127.341-85.5Q397.681-880 480.5-880q82.819 0 155.659 31.5Q709-817 763-763t85.5 127Q880-563 880-480.266q0 82.734-31.5 155.5T763-197.684q-54 54.316-127 86Q563-80 480.266-80Zm.234-60Q622-140 721-239.5t99-241Q820-622 721.188-721 622.375-820 480-820q-141 0-240.5 98.812Q140-622.375 140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z"/></svg>')

		plusIconSvg.addEventListener("click", event => {
			appendInputRowAfter(id)
			event.preventDefault()
		})

		plusIcon.appendChild(plusIconSvg)
		span.appendChild(plusIcon)
	}

	if (definition.min < 1 || definition.min === undefined)
		row.setAttribute("optional", "")
}

function appendInputRowAfter(id) {
	const rows = document.querySelectorAll(`div.row[for^="${CSS.escape(id)}"]`)

	if (rows.length <= 0)
		return

	const idParts = rows[rows.length - 1].getAttribute("for")?.split("|")
	const index = idParts && idParts.length === 3 ? parseInt(idParts[2]) + 1 : 1
	const clone = rows[0].cloneNode(true)

	clone.setAttribute("for", id + "|" + index)
	clone.querySelector("ul.error-list").replaceChildren()

	clone.querySelectorAll("[for]").forEach(e => e.setAttribute("for", id + "|" + index))
	clone.querySelectorAll("input[id]").forEach(e => e.setAttribute("id", id + "|" + index))

	clone.querySelector("span[class='plus-minus-icon']").remove()
	clone.querySelectorAll("input").forEach(input => {

		input.value = ''

		if (input?.nextElementSibling?.tagName?.toLowerCase() === 'svg') {
			input.nextElementSibling.addEventListener('click', () => {
				if (input?.placeholder !== '') {
					if (input.type === 'radio') {
						input.checked = input.placeholder === 'true'
					}
					else {
						input.text = input.placeholder
						input.value = input.placeholder
					}
				}
			})
		}
	})

	const label = clone.querySelector("label")
	if (label) {
		const minusIcon = htmlToElement('<span class="plus-minus-icon"></span>')
		const minusIconSvg = htmlToElement('<svg height="20" width="20" viewBox="0 -960 960 960"><path d="M280-453h400v-60H280v60ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/></svg>')

		minusIconSvg.addEventListener("click", () => clone.remove())

		minusIcon.appendChild(minusIconSvg)
		label.appendChild(minusIcon)
	}

	rows[rows.length - 1].after(clone)
}

function htmlToElement(html, innerText) {
	const template = document.createElement("template")
	template.innerHTML = html
	const child = template.content.firstChild

	if (innerText)
		child.innerText = innerText

	return child
}

function getResourceAsJson() {
	const resource = document.getElementById("json").innerText
	return JSON.parse(resource)
}