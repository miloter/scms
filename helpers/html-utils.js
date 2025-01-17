/**
 * Devuelve el contenido textual libre de etiquetas HTML de una pieza de HTML.
 * @param {string} html Pieza textual de HTML.
 * @returns {string}
 */
const innerText = html => {    
    const sb = []; // Resultado

    for (let i = 0; i < html.length; i++) {
        /* Comprueba si se abre o cierra una etiqueta. Obsérvese que se
         * utiliza un bucle while debido a que después de cerrarse una
         * etiqueta puede abrirse otra */
        while (i < html.length && html.charAt(i) === '<' &&
                (/\p{L}/u.test(html.charAt(i + 1)) || html.charAt(i + 1) === '/')) {
            // Leemos hasta el cierre de la etiqueta
            do {
                i++;
            } while (i < html.length && html.charAt(i) !== '>');

            if (i < html.length) {
                i++; // Leemos la etiqueta de cierre '>'
            }
        }

        if (i < html.length) {
            sb.push(html.charAt(i));
        }
    }

    return sb.join('');
};

/**
 * Reemplaza los espacios múltiplos de dos, en una cadena, por entidades HTML.
 * El final de línea se reemplaza por <br />.
 * Dos espacios por dos entidades &nbsp;.
 * Un tabulador por cuatro entidades &nbsp;.
 * @param {string} text Texto que será reemplazado.
 * @returns {string}
 */
const toHtmlSpaces = text => {
    return text
        .replace(/\r\n|\r|\n/g, '<br />')
        .replace(/  /g, '&nbsp;&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
};

/**
 * Transforma texto a un formato apto para su representación
 * como HTML. Entre otras cosas realiza lo siguiente:
 * 1. Reemplaza por entidades HTML el '<' inicial y final
 *    de las etiquetas que no se deben considerar como HTML
 *    sino como texto.
 *    Esto quiere decir que, una etiqueta como <NoHTML> que no
 *    deba considerarse HTML se reemplaza por &lt;NoHTML>.
 *    De manera similar, una etiqueta como </NoHTML>, por &lt;NoHTML>.
 * 2. El final de línea se reemplaza por <br />.
 * 3. Dos espacios consecutivos se reemplazan por dos entidades &nbsp;.
 * 4. Un tabulador por cuatro entidades &nbsp;.
 * @param {string} text
 * @returns {string}
 */
const toHtml = text => {
    /* Patrón para reconocer etiquetas que no se consideran HTML
    mientras que las etiquetas restantes no se procesarán */
    const noHtml = '(?!\\b(?:a|b|blockquote|code|em|img|li|ol|span|strong|sub|sup|ul)\\b)';

    // Reemplazamos las etiquetas de apertura que no sean para formato de HTML
    text = text.replace(new RegExp(`<${noHtml}([^/]|$)`, 'ig'), '&lt;$1');

    // Reemplazamos las etiquetas de cierre que no sean para formato de HTML
    text = text.replace(new RegExp(`</${noHtml}`, 'ig'), '&lt;/');

    return toHtmlSpaces(text);
};

export {
    innerText,
    toHtmlSpaces,
    toHtml
};