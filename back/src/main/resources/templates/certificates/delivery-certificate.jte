@param String companyName
@param String certificateNumber
@param String deliveredAt
@param String deliveredBy
@param String employeeName
@param String employeeDocument
@param String signerName
@param String notes
@param String signatureDataUrl
@param java.util.List<com.inventario.dotacion.delivery.CertificateService.CertificateItemRow> items
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Certificado de Entrega</title>
    <style>
        @page {
            margin: 24mm 16mm 20mm 16mm;
            size: A4;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: 'Source Sans 3', Arial, Helvetica, sans-serif;
            color: #2f231b;
            font-size: 12px;
            line-height: 1.45;
            background: #fffdf9;
        }

        .header {
            border: 1px solid #d9c5b2;
            border-top: 4px solid #8a5a38;
            background: #f8efe6;
            padding: 14px 16px;
            margin-bottom: 18px;
        }

        .title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #4b2f1e;
            letter-spacing: 0.2px;
        }

        .subtitle {
            margin: 5px 0 0;
            color: #6e513f;
            font-size: 12px;
        }

        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }

        .meta td {
            padding: 6px 0;
            vertical-align: top;
        }

        .meta td:first-child {
            width: 165px;
            color: #6a5344;
            font-weight: 700;
        }

        .section-title {
            margin: 18px 0 8px;
            font-size: 13px;
            color: #3b281c;
            font-weight: 700;
            border-left: 4px solid #8a5a38;
            padding-left: 8px;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        table.items th,
        table.items td {
            border: 1px solid #d9c5b2;
            padding: 8px;
            text-align: left;
        }

        table.items thead th {
            background: #f0e0d1;
            color: #5b3a26;
            font-size: 11px;
            letter-spacing: 0.25px;
            text-transform: uppercase;
        }

        table.items td.qty,
        table.items th.qty {
            text-align: right;
            width: 90px;
        }

        .notes {
            border: 1px solid #d9c5b2;
            background: #fcf6f0;
            padding: 10px;
            white-space: pre-wrap;
        }

        .signature-wrap {
            margin-top: 18px;
            border-top: 1px dashed #b38b6c;
            padding-top: 10px;
        }

        .signature-image {
            margin-top: 8px;
            max-width: 280px;
            max-height: 90px;
        }

        .footer {
            margin-top: 24px;
            font-size: 10px;
            color: #755843;
            border-top: 1px solid #e8d8ca;
            padding-top: 8px;
        }
    </style>
</head>
<body>
<div class="header">
    <h1 class="title">Certificado de Entrega de Dotacion</h1>
    <p class="subtitle">${companyName}</p>
</div>

<table class="meta">
    <tr>
        <td>Certificado</td>
        <td>${certificateNumber}</td>
    </tr>
    <tr>
        <td>Fecha de entrega</td>
        <td>${deliveredAt}</td>
    </tr>
    <tr>
        <td>Entregado por</td>
        <td>${deliveredBy}</td>
    </tr>
    <tr>
        <td>Empleado</td>
        <td>${employeeName} - ${employeeDocument}</td>
    </tr>
    @if(signerName != null && !signerName.isBlank())
    <tr>
        <td>Firma a nombre de</td>
        <td>${signerName}</td>
    </tr>
    @endif
</table>

<h2 class="section-title">Implementos entregados</h2>
<table class="items">
    <thead>
    <tr>
        <th>Codigo</th>
        <th>Implemento</th>
        <th class="qty">Cantidad</th>
    </tr>
    </thead>
    <tbody>
    @for(var item : items)
    <tr>
        <td>${item.code()}</td>
        <td>${item.name()}</td>
        <td class="qty">${item.quantity()}</td>
    </tr>
    @endfor
    </tbody>
</table>

@if(notes != null && !notes.isBlank())
<h2 class="section-title">Observaciones</h2>
<div class="notes">${notes}</div>
@endif

@if(signatureDataUrl != null)
<div class="signature-wrap">
    <strong>Firma digital</strong>
    <br>
    <img class="signature-image" src="${signatureDataUrl}" alt="Firma digital">
</div>
@endif

<div class="footer">
    Documento generado automaticamente por el sistema de Inventario Dotacion.
</div>
</body>
</html>
