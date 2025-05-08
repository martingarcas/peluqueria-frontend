import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

// Configurar las fuentes virtuales
(window as any).pdfMake = pdfMake;
(window as any).pdfMake.vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() {}

  async generarContratoLaboral(datosContrato: {
    nombreEmpleado: string;
    apellidosEmpleado: string;
    dniEmpleado?: string;
    emailEmpleado: string;
    telefonoEmpleado: string;
    fechaInicio: string;
    fechaFin?: string;
    tipoContrato: string;
  }): Promise<File> {
    const fechaActual = new Date().toLocaleDateString('es-ES');

    const documentDefinition: TDocumentDefinitions = {
      content: [
        {
          text: 'CONTRATO DE TRABAJO',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          text: `En la ciudad de Madrid, a ${fechaActual}`,
          margin: [0, 0, 0, 20]
        },
        {
          text: 'REUNIDOS',
          style: 'subheader',
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            'De una parte, ',
            { text: 'PELUQUERÍA STYLE & CARE S.L.', bold: true },
            ', con CIF B12345678 y domicilio social en Calle Principal 123, 28001 Madrid, representada por Dña. María García Pérez, en calidad de Administradora (en adelante, LA EMPRESA).'
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            'Y de otra parte, ',
            { text: `${datosContrato.nombreEmpleado} ${datosContrato.apellidosEmpleado}`, bold: true },
            ', mayor de edad, con domicilio en Madrid y ',
            `correo electrónico ${datosContrato.emailEmpleado}, teléfono ${datosContrato.telefonoEmpleado}`,
            ' (en adelante, EL/LA TRABAJADOR/A).'
          ],
          margin: [0, 0, 0, 20]
        },
        {
          text: 'MANIFIESTAN',
          style: 'subheader',
          margin: [0, 0, 0, 10]
        },
        {
          text: 'Que han acordado celebrar un contrato de trabajo con arreglo a las siguientes:',
          margin: [0, 0, 0, 20]
        },
        {
          text: 'CLÁUSULAS',
          style: 'subheader',
          margin: [0, 0, 0, 10]
        },
        {
          ol: [
            {
              text: [
                'PRIMERA.- El/la trabajador/a prestará sus servicios como ',
                { text: 'PELUQUERO/A PROFESIONAL', bold: true },
                ' en el centro de trabajo ubicado en Calle Principal 123, Madrid.'
              ],
              margin: [0, 0, 0, 10]
            },
            {
              text: [
                'SEGUNDA.- La jornada de trabajo será de 40 horas semanales, prestadas de lunes a viernes, con los descansos establecidos legal o convencionalmente.'
              ],
              margin: [0, 0, 0, 10]
            },
            {
              text: [
                'TERCERA.- El presente contrato se celebra por ',
                { text: datosContrato.tipoContrato, bold: true },
                datosContrato.fechaFin ?
                  `, iniciándose el ${new Date(datosContrato.fechaInicio).toLocaleDateString('es-ES')} y finalizando el ${new Date(datosContrato.fechaFin).toLocaleDateString('es-ES')}.` :
                  `, iniciándose el ${new Date(datosContrato.fechaInicio).toLocaleDateString('es-ES')}.`
              ],
              margin: [0, 0, 0, 10]
            },
            {
              text: 'CUARTA.- El/la trabajador/a percibirá una retribución conforme al Convenio Colectivo aplicable.',
              margin: [0, 0, 0, 10]
            },
            {
              text: 'QUINTA.- La duración de las vacaciones anuales será de 30 días naturales.',
              margin: [0, 0, 0, 10]
            },
            {
              text: 'SEXTA.- El presente contrato se regirá por lo dispuesto en la legislación vigente que resulte de aplicación, particularmente el Estatuto de los Trabajadores y Convenio Colectivo de Peluquerías.',
              margin: [0, 0, 0, 10]
            }
          ]
        },
        {
          text: 'Y para que conste y surta los efectos oportunos, se extiende y firma el presente contrato por duplicado ejemplar en el lugar y fecha indicados en el encabezamiento.',
          margin: [0, 20, 0, 40]
        },
        {
          columns: [
            {
              text: 'LA EMPRESA',
              alignment: 'center'
            },
            {
              text: 'EL/LA TRABAJADOR/A',
              alignment: 'center'
            }
          ],
          margin: [0, 0, 0, 40]
        },
        {
          columns: [
            {
              text: 'Fdo.: María García Pérez',
              alignment: 'center'
            },
            {
              text: `Fdo.: ${datosContrato.nombreEmpleado} ${datosContrato.apellidosEmpleado}`,
              alignment: 'center'
            }
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        subheader: {
          fontSize: 14,
          bold: true
        }
      },
      defaultStyle: {
        fontSize: 12,
        lineHeight: 1.3
      }
    };

    // Generar el PDF como Blob
    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

    return new Promise((resolve) => {
      pdfDocGenerator.getBlob((blob) => {
        // Convertir el Blob a File
        const file = new File([blob], 'contrato_laboral.pdf', { type: 'application/pdf' });
        resolve(file);
      });
    });
  }
}
