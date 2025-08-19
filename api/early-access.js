// Using the ES Module syntax for Vercel Edge Functions
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // 1. Check for the correct HTTP method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, honeypot } = await req.json();

    // 2. Check the honeypot field to prevent spam
    if (honeypot) {
      return new Response(JSON.stringify({ message: 'Success' }), { // Silently fail for bots
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Validate the email address
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Please provide a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // This is your Resend API Key. It's safe to have it here because
    // this code ONLY runs on Vercel's servers, not in the browser.
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const YOUR_EMAIL = process.env.YOUR_EMAIL; // Your email from env vars

    if (!RESEND_API_KEY || !YOUR_EMAIL) {
        throw new Error('Server environment variables are not configured.');
    }

    // 4. Send the email using the Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'no-reply@zelendar.com',
        to: YOUR_EMAIL,
        subject: '🎉 New Zelendar Early Access Signup!',
        html: `<p>A new user has signed up for early access:</p><strong>${email}</strong>`,
      }),
    });

    if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        console.error('Resend API Error:', errorData);
        throw new Error('Failed to send email.');
    }

    // 5. Send a success response back to the frontend
    return new Response(JSON.stringify({ message: 'Success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}