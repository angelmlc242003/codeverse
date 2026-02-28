// netlify/functions/verifyRecaptcha.js
export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, success: false, msg: "Método no permitido" })
    };
  }

  try {
    const { token } = JSON.parse(event.body || "{}");

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, success: false, msg: "Token faltante" })
      };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY?.trim() || null;

    if (!secretKey) {
      console.error("Falta RECAPTCHA_SECRET_KEY en env vars");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, success: false, msg: "Server configuration error: missing recaptcha secret" })
      };
    }

    const recaptchaResp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });

    if (!recaptchaResp.ok) {
      const text = await recaptchaResp.text();
      console.error("Google reCAPTCHA returned non-200:", recaptchaResp.status, text);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ ok: false, success: false, msg: "Error contacting reCAPTCHA provider", status: recaptchaResp.status, detail: text })
      };
    }

    const recaptchaData = await recaptchaResp.json();
    console.log("reCAPTCHA verification result:", recaptchaData);

    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");

    if (!recaptchaData.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, success: false, msg: "reCAPTCHA verification failed", data: recaptchaData })
      };
    }

    if (typeof recaptchaData.score !== "undefined" && recaptchaData.score < minScore) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, success: false, msg: "Recaptcha score too low", score: recaptchaData.score, minScore })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, success: true, msg: "reCAPTCHA validated", data: recaptchaData })
    };

  } catch (err) {
    console.error("verifyRecaptcha unexpected error:", err && (err.stack || err.message || err));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, success: false, msg: "Error interno del servidor", error: String(err) })
    };
  }
};