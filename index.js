// const puppeteer = require("puppeteer");
import express from "express";
import puppeteer from "puppeteer";
import bodyParser from "body-parser";
import { PORT } from "./config.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(PORT);

app.post("/login", async (req, res) => {
  var cedula = req.body.cedula;
  var password = req.body.password;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("http://servicios.fpune.edu.py:82/consultor/");
    await page.waitForSelector(".form-signin");
    await page.type("#usuario", cedula);
    await page.type("#clave", password);

    await page.click(".btn").then(async () => {
      await page.waitForSelector(".container");
      var url = page.url();
      if (url == "http://servicios.fpune.edu.py:82/consultor/Error.html") {
        res.status(400).send("Credenciales incorrectas");
      } else if (
        url == "http://servicios.fpune.edu.py:82/consultor/detalle.php"
      ) {
        const datos = await page.$eval("*", (el) => el.innerText);
        await page.close();
        var datosPalabras = datos.trim().split(/\s+/);
        var cedula = datosPalabras[0];
        var nombreCompleto = "";
        var promedio = "";
        var asistencias = [];
        var parciales = [];
        var habilitaciones = [];
        var calificacionesList = [];

        var swNombre = false;
        var swAsist = false;
        var swParciales = false;
        var swHabilitaciones = false;
        var swCalificaciones = false;

        datosPalabras.forEach((palabra, index) => {
          if (palabra == "Contacto") {
            swNombre = true;
          }
          if (index >= 1 && swNombre == false) {
            nombreCompleto = nombreCompleto + " " + palabra;
          }
          if (palabra == "Promedio...:") {
            promedio = datosPalabras[index + 1];
          }

          if (palabra == "Asist." && swAsist == false) {
            var i = index + 1;

            for (i; swAsist == false; i++) {
              if (datosPalabras[i] == "ULTIMOS") {
                swAsist = true;
                break;
              }
              var materia = "";
              var j = i + 1;
              for (j; datosPalabras[j] != "Sem.:"; j++) {
                materia = materia + " " + datosPalabras[j];
              }

              i = j + 5;
              var porcentaje = datosPalabras[i];
              asistencias.push(
                JSON.parse(
                  '{"materia":' +
                    '"' +
                    materia +
                    '"' +
                    ',"porcentaje":' +
                    '"' +
                    porcentaje +
                    '"' +
                    "}"
                )
              );
            }
          }

          if (palabra == "Eval." && swParciales == false) {
            var i = index + 1;
            for (i; swParciales == false; i++) {
              if (datosPalabras[i] == "HABILITACIONES") {
                swParciales = true;
                break;
              }
              var materia = "";
              var j = i + 1;
              for (j; datosPalabras[j] != "Sem.:"; j++) {
                materia = materia + " " + datosPalabras[j];
              }
              i = j + 2;
              var calificaciones = "";
              var k = 0;
              for (i; !isNaN(datosPalabras[i]); i++) {
                if (k == 0) {
                  calificaciones = '{"1ra":' + '"' + datosPalabras[i] + '"';
                } else if (k == 1) {
                  calificaciones =
                    calificaciones + ',"2da":' + '"' + datosPalabras[i] + '"';
                } else if (k == 2) {
                  calificaciones =
                    calificaciones + ',"TP":' + '"' + datosPalabras[i] + '"';
                } else if (k == 3) {
                  calificaciones =
                    calificaciones + ',"Lab":' + '"' + datosPalabras[i] + '"}';
                }
                k = k + 1;
              }

              if (k < 4) {
                if (k == 0) {
                  calificaciones = '{"1ra":"0","2da":"0","TP":"0","Lab":"0"}';
                }
                if (k == 1) {
                  calificaciones =
                    calificaciones + ',"2da":"0","TP":"0","Lab":"0"}';
                }
                if (k == 2) {
                  calificaciones = calificaciones + ',"TP":"0","Lab":"0"}';
                }
                if (k == 3) {
                  calificaciones = calificaciones + ',"Lab":"0"}';
                }
              }

              parciales.push(
                JSON.parse(
                  '{"materia":' +
                    '"' +
                    materia +
                    '"' +
                    ',"calificaciones":' +
                    calificaciones +
                    "}"
                )
              );

              i = i + 1;
              var metodoEval = datosPalabras[i];
            }
          }

          if (palabra == "Periodo" && swHabilitaciones == false) {
            var i = index + 1;
            for (i; swHabilitaciones == false; i++) {
              if (datosPalabras[i] == "RESULTADOS") {
                swHabilitaciones = true;
                break;
              }

              var materia = "";
              var j = i + 1;
              for (j; datosPalabras[j] != "Sem.:"; j++) {
                materia = materia + " " + datosPalabras[j];
              }

              i = j + 2;
              var bonificacion = datosPalabras[i];
              habilitaciones.push(
                JSON.parse(
                  '{"materia":' +
                    '"' +
                    materia +
                    '"' +
                    ',"bonificacion":' +
                    '"' +
                    bonificacion +
                    '"' +
                    "}"
                )
              );
              i = i + 2;
            }
          }

          if (palabra == "Acta" && swCalificaciones == false) {
            var i = index + 1;
            for (i; swCalificaciones == false; i++) {
              if (datosPalabras[i] == "MATERIAS") {
                swCalificaciones = true;
                break;
              }

              var materia = "";
              var j = i + 1;
              for (
                j;
                datosPalabras[j] != "1" &&
                datosPalabras[j] != "2" &&
                datosPalabras[j] != "3" &&
                datosPalabras[j] != "4" &&
                datosPalabras[j] != "5" &&
                datosPalabras[j] != "6" &&
                datosPalabras[j] != "7" &&
                datosPalabras[j] != "8" &&
                datosPalabras[j] != "9" &&
                datosPalabras[j] != "10";
                j++
              ) {
                materia = materia + " " + datosPalabras[j];
              }
              var semestre = datosPalabras[j];

              i = j + 2;
              var nota = datosPalabras[i];
              switch (nota) {
                case "Uno":
                  nota = "1";
                  break;
                case "Dos":
                  nota = "2";
                  break;
                case "Tres":
                  nota = "3";
                  break;
                case "Cuatro":
                  nota = "4";
                  break;
                case "Cinco":
                  nota = "5";
                  break;
              }
              calificacionesList.push(
                JSON.parse(
                  '{"materia":' +
                    '"' +
                    materia +
                    '"' +
                    ',"semestre":' +
                    '"' +
                    semestre +
                    '"' +
                    ',"nota":' +
                    '"' +
                    nota +
                    '"' +
                    "}"
                )
              );
              i = i + 1;
            }
          }
        });

        var Datos = {
          cedula: cedula,
          nombreCompleto: nombreCompleto,
          promedio: promedio,
          asistencias: asistencias,
          parciales: parciales,
          habilitaciones: habilitaciones,
          calificaciones: calificacionesList,
        };
        res.send(JSON.stringify(Datos));
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Intentalo de nuevo mas tarde...");
  }
});
console.log("Server running on port " + PORT);

// (async () => {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.goto("http://servicios.fpune.edu.py:82/consultor/");

//   await page.waitForSelector(".form-signin");

//   await page.type("#usuario", "6569295");
//   await page.type("#clave", "9441");

// })();
