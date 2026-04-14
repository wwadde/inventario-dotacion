@param String companyName
@param String employeeName
@param String today
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Feliz cumpleanos</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f7f2ec;
            font-family: Arial, Helvetica, sans-serif;
            color: #2f231b;
        }

        .mail-wrap {
            max-width: 640px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #decbb9;
            border-top: 4px solid #2f7f65;
        }

        .mail-head {
            padding: 18px 22px 10px;
            background: #e8f3ee;
        }

        .mail-title {
            margin: 0;
            font-size: 20px;
            color: #1f5e49;
        }

        .mail-subtitle {
            margin: 6px 0 0;
            font-size: 13px;
            color: #4b7567;
        }

        .mail-body {
            padding: 18px 22px 22px;
            line-height: 1.5;
            font-size: 14px;
        }

        .badge {
            display: inline-block;
            margin-top: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            background: #d7ede4;
            color: #1f5e49;
            font-size: 12px;
            font-weight: 700;
        }

        .mail-footer {
            padding: 12px 22px 18px;
            border-top: 1px solid #e0eee8;
            color: #5a7e71;
            font-size: 12px;
        }
    </style>
</head>
<body>
<div class="mail-wrap">
    <div class="mail-head">
        <h1 class="mail-title">Feliz cumpleanos, ${employeeName}</h1>
        <p class="mail-subtitle">${companyName}</p>
    </div>
    <div class="mail-body">
        <p>En este dia especial (${today}), te enviamos un saludo con nuestros mejores deseos.</p>
        <p>Gracias por tu compromiso y por ser parte del equipo.</p>
        <span class="badge">Que tengas un excelente dia</span>
    </div>
    <div class="mail-footer">
        Mensaje automatico del sistema de dotacion.
    </div>
</div>
</body>
</html>
