/**
 * Módulo que permite usar una pequeña barra de botones
 * de edición de contenidos en HTML.
 * 
 * @author M. López
 * @version 1.1
 * @since 04/07/2020
 * @license Todo este software tendrá la condición de libre
 * y cualquiera podrá usarlo, modificarlo, estudiarlo y
 * compartirlo.
 */

'use strict';

let edButtons = [];
let edOpenTags = [];

edButtons[edButtons.length] = new EdButton('ed_b', 'b', '<b>', '</b>',
	'n', 0, 'Etiqueta &lt;b&gt; para texto en negrita');
edButtons[edButtons.length] = new EdButton('ed_em', 'em', '<em>', '</em>',
	'i', 0, 'Etiqueta &lt;em&gt; para texto enfatizado en cursiva');
edButtons[edButtons.length] = new EdButton('ed_link', 'link', '', '</a>',
	'a', 0, 'Etiqueta &lt;a&gt; inserta un enlace que se abre en una nueva entana'); // Caso especial
edButtons[edButtons.length] = new EdButton('ed_block', 'b-quote', '<blockquote>', '</blockquote>',
	'q', 0, 'Etiqueta &lt;blockquoute&gt; para identar y destacar texto');
edButtons[edButtons.length] = new EdButton('ed_code', 'code', '<code>', '</code>',
	'c', 0, 'Etiqueta &lt;code&gt; para poner el texto con tipografía de consola');
edButtons[edButtons.length] = new EdButton('ed_img', 'img', '', '',
	'm', -1, 'Etiqueta &lt;img&gt; inserta una referencia a una imagen'); // Caso especial
edButtons[edButtons.length] = new EdButton('ed_sub', 'sub', '<sub>', '</sub>',
	'0', 0, 'Etiqueta &lt;sub&gt; para sub-índice');
edButtons[edButtons.length] = new EdButton('ed_sup', 'sup', '<sup>', '</sup>',
	'1', 0, 'Etiqueta &lt;sup&gt; para super-índice');
edButtons[edButtons.length] = new EdButton('ed_red', 'red',
	'<span class="color-red">', '</span>',
	'', 0, 'Etiqueta &lt;span&gt; para poner el texto en color rojo');
edButtons[edButtons.length] = new EdButton('ed_green', 'green',
	'<span class="color-green">', '</span>',
	'', 0, 'Etiqueta &lt;span&gt; para poner el texto en color verde');
edButtons[edButtons.length] = new EdButton('ed_blue', 'blue',
	'<span class="color-blue">', '</span>',
	'', 0, 'Etiqueta &lt;span&gt; para poner el texto en color azul');

function EdButton(id, display, tagStart, tagEnd, access, open, title) {
	this.id = id;				// El nombre del botón en la barra
	this.display = display;		// Etiqueta o título del botón
	this.tagStart = tagStart; 	// Etiqueta de apertura
	this.tagEnd = tagEnd;		// Etiqueta de cierre
	this.access = access;		// Tecla de acceso (Alt+?), donde ? es una tecla
	this.open = open;			// Establecer a -1 si la etiqueta no necesita cerrarse
	this.title = title || '';	// Título que se mostrará al pasar el mouse
}

function edShowButton(button, i) {
    switch (button.id) {
        case 'ed_img':
            document.write('<input type="button" id="' + button.id + '"\
			accesskey="' + button.access + '" class="btn btn-edit"\
			onclick="edInsertImage(edCanvas);" value="' + button.display + '"\
			title="' + button.title + '" />');
            break;
        case 'ed_link':
            document.write('<input type="button" id="' + button.id + '"\
			accesskey="' + button.access + '" class="btn btn-edit"\
			onclick="edInsertLink(edCanvas, ' + i + ');"\
			value="' + button.display + '" title="' + button.title + '" />');
            break;
        case 'ed_red': case 'ed_green': case 'ed_blue':
            document.write('<input type="button" id="' + button.id + '"\
			accesskey="' + button.access + '"\
			class="btn btn-edit' + ' bgc-' + button.id.substr(3) + '"\
			onclick="edInsertTag(edCanvas, ' + i + ');"\
			value="' + button.display + '" title="' + button.title + '" />');
            break;
        default:
            document.write('<input type="button" id="' + button.id + '"\
            accesskey="' + button.access + '"\
			class="btn btn-edit" onclick="edInsertTag(edCanvas, ' + i + ');"\
			value="' + button.display + '" title="' + button.title + '"  />');
            break;
    }	
}

function edAddTag(button) {
	if (edButtons[button].tagEnd != '') {
		edOpenTags[edOpenTags.length] = button;
		document.getElementById(edButtons[button].id).value = '/' + document.getElementById(edButtons[button].id).value;
	}
}

function edRemoveTag(button) {
	for (let i = 0; i < edOpenTags.length; i++) {
		if (edOpenTags[i] == button) {
			edOpenTags.splice(i, 1);
			document.getElementById(edButtons[button].id).value = 		document.getElementById(edButtons[button].id).value.replace('/', '');
		}
	}
}

function edCheckOpenTags(button) {
	let tag = 0;
	for (let i = 0; i < edOpenTags.length; i++) {
		if (edOpenTags[i] == button) {
			tag++;
		}
	}
	if (tag > 0) {
		return true; // Etiqueta abierta encontrada
	}
	else {
		return false; // La etiqueta no está abierta
	}
}	

function edCloseAllTags() {
	let count = edOpenTags.length;
	for (let o = 0; o < count; o++) {
		edInsertTag(edCanvas, edOpenTags[edOpenTags.length - 1]);
	}
}

// Inserta una etiqueta en la posición del cursor, o rodeando contenido.
function edInsertTag(myField, i) {
	// Para IE
	if (document.selection) {
		myField.focus();
	    let sel = document.selection.createRange();
		if (sel.text.length > 0) {
			sel.text = edButtons[i].tagStart + sel.text + edButtons[i].tagEnd;
		}
		else {
			if (!edCheckOpenTags(i) || edButtons[i].tagEnd == '') {
				sel.text = edButtons[i].tagStart;
				edAddTag(i);
			}
			else {
				sel.text = edButtons[i].tagEnd;
				edRemoveTag(i);
			}
		}
		myField.focus();	
	}
	// Chrome y Mozilla
	else if (myField.selectionStart || myField.selectionStart == '0') {		
		let startPos = myField.selectionStart;
		let endPos = myField.selectionEnd;
		let cursorPos = endPos;
		if (startPos != endPos) {
			myField.value = myField.value.substring(0, startPos)
			              + edButtons[i].tagStart
			              + myField.value.substring(startPos, endPos) 
			              + edButtons[i].tagEnd
			              + myField.value.substring(endPos, myField.value.length);
			cursorPos += edButtons[i].tagStart.length + edButtons[i].tagEnd.length;
		}
		else {
			if (!edCheckOpenTags(i) || edButtons[i].tagEnd == '') {
				myField.value = myField.value.substring(0, startPos) 
				              + edButtons[i].tagStart
				              + myField.value.substring(endPos, myField.value.length);
				edAddTag(i);
				cursorPos = startPos + edButtons[i].tagStart.length;
			}
			else {
				myField.value = myField.value.substring(0, startPos) 
				              + edButtons[i].tagEnd
				              + myField.value.substring(endPos, myField.value.length);
				edRemoveTag(i);
				cursorPos = startPos + edButtons[i].tagEnd.length;
			}
		}
		myField.focus();
		myField.selectionStart = cursorPos;
		myField.selectionEnd = cursorPos;
	} else {
		if (!edCheckOpenTags(i) || edButtons[i].tagEnd == '') {
			myField.value += edButtons[i].tagStart;
			edAddTag(i);
		}
		else {
			myField.value += edButtons[i].tagEnd;
			edRemoveTag(i);
		}
		myField.focus();
	}
}

function edInsertContent(myField, myValue) {
	// Para IE
	if (document.selection) {
		myField.focus();
		let sel = document.selection.createRange();
		sel.text = myValue;
		myField.focus();
	}
	// Chrome y Mozilla
	else if (myField.selectionStart || myField.selectionStart == '0') {
		let startPos = myField.selectionStart;
		let endPos = myField.selectionEnd;
		myField.value = myField.value.substring(0, startPos)
		              + myValue 
                      + myField.value.substring(endPos, myField.value.length);
		myField.focus();
		myField.selectionStart = startPos + myValue.length;
		myField.selectionEnd = startPos + myValue.length;
	} else {
		myField.value += myValue;
		myField.focus();
	}
}

function edInsertLink(myField, i, defaultValue) {
	if (!defaultValue) {
		defaultValue = 'https://';
	}
	if (!edCheckOpenTags(i)) {
		let url = prompt('Introduzca la URL' ,defaultValue);
		if (url) {
			edButtons[i].tagStart = '<a target="_blank" href="' +
				formatUrl(url) + '">';
			edInsertTag(myField, i);
		}
	}
	else {
		edInsertTag(myField, i);
	}
}

/**
 * Formatea una url y devuelve el resultado:
 *     1. Si el comienzo de la URL es (letra:), agrega el prefijo "file:///"
 *     2. Reemplaza todos los caracteres '\' por '/'.
 *     3. Reemplaza todos los espacios por el carácter '%20'.
 * @param {string} url 
 */
function formatUrl(url) {	
	if (/^[a-z]:/i.test(url)) {
		url = 'file:///' + url;
	}

	url = url.replace(/\\/g, '/');
	url = url.replace(/\s/g, '%20');

	return url;
}

function edInsertImage(myField) {
	let myValue = prompt('Introduzca la URL de la imagen', 'https://');
	if (myValue) {
	    myValue = '<img src="' + myValue + '" alt="' +
            prompt('Introduzca una descripción', '') +
            '" class="block col-12 center p-1" />';
		edInsertContent(myField, myValue);
	}
}

/**
 * Punto de entrada desde donde se escribirá en el HTML la barra
 * de herramientas.
 */
function edToolbar() {
	document.write('<div class="ta-l" id="ed_toolbar">');
	for (let i = 0; i < edButtons.length; i++) {
		edShowButton(edButtons[i], i);
	}
	document.write('<input type="button" id="ed_close" class="btn btn-edit" onclick="edCloseAllTags();" title="Cierra todas las etiquetas abiertas" value="</..." />');	
	document.write('</div>');
}
