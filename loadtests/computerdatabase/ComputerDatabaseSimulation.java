package computerdatabase;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import io.gatling.javaapi.jdbc.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;
import static io.gatling.javaapi.jdbc.JdbcDsl.*;

public class WichatSimulation extends Simulation {

  private HttpProtocolBuilder httpProtocol = http
    .baseUrl("http://172.211.110.192:8000")
    .inferHtmlResources()
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36");
  
  private Map<CharSequence, String> headers_0 = Map.of("If-None-Match", "130b2de596a4807557d5ecffa2ba37d29f1286d1");
  
  private Map<CharSequence, String> headers_1 = Map.ofEntries(
    Map.entry("Origin", "http://172.211.110.192:3000"),
    Map.entry("Sec-Purpose", "prefetch;prerender"),
    Map.entry("sec-ch-ua", "Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135"),
    Map.entry("sec-ch-ua-mobile", "?0"),
    Map.entry("sec-ch-ua-platform", "Windows")
  );
  
  private Map<CharSequence, String> headers_2 = Map.of("Origin", "http://172.211.110.192:3000");
  
  private Map<CharSequence, String> headers_3 = Map.ofEntries(
    Map.entry("Accept", "application/json, text/plain, */*"),
    Map.entry("Content-Type", "application/json")
  );
  
  private Map<CharSequence, String> headers_10 = Map.of("Accept", "application/json, text/plain, */*");
  
  private Map<CharSequence, String> headers_59 = Map.of("Content-Type", "application/json");
  
  private String uri1 = "http://commons.wikimedia.org/wiki/Special:FilePath";
  
  private String uri2 = "http://unpkg.com/three-globe/example/img/earth-night.jpg";
  
  private String uri3 = "https://fonts.gstatic.com/s/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.woff2";
  
  private String uri4 = "172.211.110.192";
  
  // Función para generar nombres de usuario aleatorios
  private String generateRandomUsername() {
    int random = ThreadLocalRandom.current().nextInt(100000, 999999);
	int random2 = ThreadLocalRandom.current().nextInt(100000, 999999);
	int random3 = ThreadLocalRandom.current().nextInt(100000, 999999);
    return "user" + random2 + random3 + random;
  }

  private ScenarioBuilder scn = scenario("RecordedSimulation")
    .exec(session -> {
        // Generar un nombre de usuario aleatorio y guardarlo en la sesión
        String username = generateRandomUsername();
        String password = "password123";
        return session.set("username", username).set("password", password);
    })
    .exec(
      http("Inicio")
        .get("http://" + uri4 + ":3000/static/css/main.79ece73b.css")
        .headers(headers_0),
      pause(2), // Reducido de 30 a 2 segundos para pruebas más rápidas
      http("Ir A Registro")
        .get(uri3)
        .headers(headers_1)
        .resources(
          http("Cargar recurso multimedia")
            .get(uri2)
            .headers(headers_2)
        ),
      pause(2), // Reducido de 30 a 2 segundos para pruebas más rápidas
      http("Añadir Usuario")
        .post("/adduser")
        .headers(headers_3)
        .body(StringBody(session -> {
            // Creación dinámica del JSON de registro
            String username = session.getString("username");
            String password = session.getString("password");
            return "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
        })),
      pause(2), // Reducido de 13 a 2 segundos para pruebas más rápidas
      http("Iniciar Sesión")
        .post("/login")
        .headers(headers_3)
        .body(StringBody(session -> {
            // Creación dinámica del JSON de login
            String username = session.getString("username");
            String password = session.getString("password");
            return "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
        }))
        .resources(
          http("Cargar recurso multimedia")
            .get("http://" + uri4 + ":3000/static/media/WIChat.d9fd05098a892ba7c4b8.png"),
          http("Cargar recurso multimedia")
            .get("http://" + uri4 + ":3000/static/media/world-bg.e8a18cc5ccdbe872483c.png")
        ),
      pause(2), // Reducido para pruebas más rápidas
      http("Cargar recurso multimedia")
        .get("http://" + uri4 + ":3000/static/media/correct.34272180f5125c553159.mp3")
        .resources(
          http("Cargar recurso multimedia")
            .get("http://" + uri4 + ":3000/static/media/wrong.994da241422d523149ed.mp3"),
          http("Obtener Ajustes")
            .get(session -> "/getSettings/" + session.getString("username")),
          http("Obtener Pregunta")
            .get("/question?capital=true&flag=true&monument=true&food=true")
            .headers(headers_10),
          http("Cargar recurso multimedia")
            .get(uri1 + "/Pinza%20triestina.jpg?width=500&height=300")
        ),
      pause(2),
      http("Obtener Pregunta")
        .get("/question?capital=true&flag=true&monument=true&food=true")
        .headers(headers_10)
        .resources(
          http("Cargar recurso multimedia")
            .get(uri1 + "/Flag%20of%20Grenada.svg?width=500&height=300")
        ),
      pause(2),
      http("Obtener Pregunta")
        .get("/question?capital=true&flag=true&monument=true&food=true")
        .headers(headers_10)
        .resources(
          http("Cargar recurso multimedia")
            .get(uri1 + "/Noravank%20panorama.jpg?width=500&height=300")
        ),
      pause(2),
      http("Preguntar al LLM")
        .post("/askllm")
        .headers(headers_3)
        .body(StringBody("{\"question\":\"¿De qué país es este monumento?\",\"model\":\"gemini\",\"correctAnswer\":\"test\"}")).asJson(),
      pause(2),
      http("Obtener Pregunta")
        .get("/question?capital=true&flag=true&monument=true&food=true")
        .headers(headers_10)
        .resources(
          http("Obtener Pregunta")
            .get("/question?capital=true&flag=true&monument=true&food=true")
            .headers(headers_10),
          http("Cargar recurso multimedia")
            .get(uri1 + "/Penafiel-Espana0011.JPG?width=500&height=300")
        ),
      pause(2),
      http("Obtener Pregunta")
        .get("/question?capital=true&flag=true&monument=true&food=true")
        .headers(headers_10)
        .resources(
          http("Cargar recurso multimedia")
            .get(uri1 + "/Luxemburg.jpg?width=500&height=300")
        ),
      pause(2),
      http("Obtener Pregunta")
        .get("/question?capital=true&flag=true&monument=true&food=true")
        .headers(headers_10)
        .resources(
          http("Obtener Pregunta")
            .get("/question?capital=true&flag=true&monument=true&food=true")
            .headers(headers_10),
          http("Cargar recurso multimedia")
            .get(uri1 + "/Monteiro%20Lopes.jpg?width=500&height=300")
        ),
      pause(2),
      http("Preguntar al LLM")
        .post("/askllm")
        .headers(headers_3)
        .body(StringBody("{\"question\":\"¿De qué país es este monumento?\",\"model\":\"gemini\",\"correctAnswer\":\"test\"}")).asJson(),
      pause(2),
      http("Obtener Pregunta")
        .get("/question?capital=true&flag=true&monument=true&food=true")
        .headers(headers_10)
        .resources(
          http("Cargar recurso multimedia")
            .get(uri1 + "/All%20Gizah%20Pyramids.jpg?width=500&height=300")
        ),
      pause(2),
      http("Aumentar Partidas Jugadas")
        .post("/incrementGamesPlayed")
        .headers(headers_3)
        .body(StringBody(session -> "{\"username\":\"" + session.getString("username") + "\"}")),
      pause(2),
      http("Actualizar Estadísticas")
        .post("/updateStats")
        .headers(headers_3)
        .body(StringBody(session -> {
            String username = session.getString("username");
            // Generar estadísticas aleatorias
            int correctAnswers = ThreadLocalRandom.current().nextInt(1, 10);
            int wrongAnswers = ThreadLocalRandom.current().nextInt(1, 5);
			int timeTaken = ThreadLocalRandom.current().nextInt(10, 400);
            return "{\"username\":\"" + username + "\",\"correct\":" + correctAnswers + ",\"wrong\":" + wrongAnswers + ",\"timeTaken\":" + timeTaken + "}";
        })),
      pause(2),
      http("Consultar Ranking")
        .get("/ranking?sortBy=correctAnswers")
        .headers(headers_10),
      pause(2),
      http("Consultar Ranking")
        .get("/ranking?sortBy=wrongAnswers")
        .headers(headers_10),
      pause(2),
      http("Consultar Perfil")
        .get(session -> "/profile/" + session.getString("username"))
        .headers(headers_10)
        .resources(
          http("Obtener Amigos")
            .post("/friends")
            .headers(headers_3)
            .body(StringBody(session -> "{\"username\":\"" + session.getString("username") + "\"}"))
        ),
      pause(2),
      http("Obtener Ajustes")
        .get(session -> "/getSettings/" + session.getString("username")),
      pause(2),
      http("Guardar Ajustes")
        .post(session -> "/saveSettings/" + session.getString("username"))
        .headers(headers_59)
        .body(StringBody("{\"answerTime\":40,\"questionAmount\":10,\"capital\":true,\"flag\":false,\"monument\":false,\"food\":true}"))
    );

  {
    // Inyección de usuarios: 2 por segundo durante 60 segundos
    setUp(
      scn.injectOpen(
        constantUsersPerSec(20).during(Duration.ofSeconds(60))
      )
    ).protocols(httpProtocol);
  }
}