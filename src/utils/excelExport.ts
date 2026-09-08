import { IncidentReport } from '../types';

/**
 * Exports the incident reports to an Excel-compatible HTML/XML format.
 * This ensures beautiful tabular formatting, custom column widths, 
 * bold headers, proper accent marks (UTF-8), and compatibility with 
 * Microsoft Excel, Google Sheets, and LibreOffice.
 */
export function exportToExcel(reports: IncidentReport[]): void {
  // Define headers in Spanish
  const headers = [
    'FECHA REGISTRO',
    'INFORMANTE',
    'ODPE',
    'DISTRITO / ZONA',
    'ID RUBRO',
    'CATEGORÍA DE RUBRO',
    'PREGUNTA EVALUADA',
    '¿REGISTRÓ INCIDENCIA?',
    'OCURRENCIA / INCIDENCIA',
    'CONSECUENCIA',
    'ACCIONES DE LA ODPE',
    'FUENTE DE EVIDENCIA'
  ];

  // Map reports to rows
  const rows = reports.map(r => {
    const dateFormatted = r.fecha_creacion 
      ? new Date(r.fecha_creacion).toLocaleString('es-PE', { timeZone: 'America/Lima' })
      : new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

    const cleanEvidence = r.fuente_evidencia
      ? (r.fuente_evidencia.includes('|||') 
          ? `${r.fuente_evidencia.split('|||')[0]} [Adjunto: ${r.fuente_evidencia.split('|||')[2]}]` 
          : r.fuente_evidencia)
      : '-';

    return [
      dateFormatted,
      r.nombre_informante || '',
      r.odpe || '',
      r.distrito || '',
      r.rubro_id !== undefined ? String(r.rubro_id) : '',
      r.categoria || '',
      r.pregunta_texto || '',
      r.tiene_problema ? 'SÍ' : 'NO',
      r.ocurrencia || '-',
      r.consecuencia || '-',
      r.acciones_odpe || '-',
      cleanEvidence
    ];
  });

  // Build the Excel HTML Spreadsheet format
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Reportes de Incidencias MACE</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th { 
          background-color: #0F172A; 
          color: #FFFFFF; 
          font-weight: bold; 
          text-align: left; 
          padding: 10px; 
          border: 2px solid #E2E8F0; 
          font-size: 13px;
        }
        td { 
          padding: 8px 10px; 
          border: 1px solid #E2E8F0; 
          font-size: 12px; 
          color: #1E293B; 
        }
        tr:nth-child(even) { background-color: #F8FAFC; }
        .title-header { 
          font-size: 18px; 
          font-weight: bold; 
          color: #FFFFFF; 
          background-color: #0F172A;
          border-bottom: 4px solid #F59E0B;
          padding: 15px 0; 
          text-align: center;
        }
        .badge-si { background-color: #FEE2E2; color: #991B1B; font-weight: bold; text-align: center; }
        .badge-no { background-color: #D1FAE5; color: #065F46; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${headers.length}" class="title-header">
            REPORTE DE INCIDENCIAS DE COYUNTURA - ONPE (MACE)
          </td>
        </tr>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
        ${rows.map(row => `
          <tr>
            ${row.map((val, idx) => {
              // Highlight SI/NO to make it visually clear instantly in Excel
              let className = '';
              if (idx === 7) {
                className = val === 'SÍ' ? 'class="badge-si"' : 'class="badge-no"';
              }
              return `<td ${className}>${val}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  // Create file blob and trigger download
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const today = new Date().toISOString().slice(0,10);
  link.download = `ONPE_Reportes_MACE_${today}.xls`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
