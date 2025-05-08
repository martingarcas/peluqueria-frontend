import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() {}

  generarContratoTrabajador(datos: any): Observable<File> {
    return from(new Promise<File>((resolve, reject) => {
      try {
        const doc = new jsPDF();

        // Configuración de fuente y tamaños
        doc.setFontSize(18);
        doc.text('CONTRATO DE TRABAJO', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`En la ciudad de [CIUDAD], a ${new Date().toLocaleDateString()}`, 20, 40);

        doc.setFontSize(12);
        doc.text('REUNIDOS', 20, 60);

        doc.text('De una parte, LA EMPRESA, con domicilio en [DIRECCIÓN EMPRESA].', 20, 70);
        doc.text(`De otra parte, ${datos.nombre} ${datos.apellidos}, mayor de edad, con`, 20, 80);
        doc.text('domicilio en [DIRECCIÓN TRABAJADOR].', 20, 90);

        doc.text('ACUERDAN', 20, 110);

        doc.text('Celebrar el presente CONTRATO DE TRABAJO, que se regirá por las siguientes:', 20, 120);

        doc.text('CLÁUSULAS', 20, 140);

        doc.text('PRIMERA.- El trabajador prestará sus servicios como PELUQUERO/A.', 20, 160);

        const tipoContrato = datos.tipoContrato === 'fijo' ? 'INDEFINIDA' : 'TEMPORAL';
        doc.text(`SEGUNDA.- La duración del contrato será ${tipoContrato}${
          datos.tipoContrato === 'temporal' ? `, desde ${datos.fechaInicio} hasta ${datos.fechaFin}` : ''
        }.`, 20, 170);

        doc.text(`TERCERA.- El trabajador percibirá una retribución de ${datos.salario}€ brutos anuales.`, 20, 180);

        doc.text('CUARTA.- La jornada de trabajo será según el horario asignado.', 20, 190);

        doc.text('Y para que conste, se extiende este contrato por triplicado en el lugar y', 20, 210);
        doc.text('fecha indicados, firmando las partes interesadas:', 20, 220);

        doc.text('Firma del trabajador', 50, 250);
        doc.text('Firma de la empresa', 150, 250);

        // Convertir el PDF a File
        const pdfBlob = new Blob([doc.output('blob')], { type: 'application/pdf' });
        const file = new File([pdfBlob], 'contrato.pdf', { type: 'application/pdf' });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    }));
  }
}
