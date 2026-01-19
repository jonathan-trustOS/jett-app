import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const firstName = name?.split(' ')[0] || ''
    const greeting = firstName ? `Hey ${firstName},` : 'Hey,'

    const { data, error } = await resend.emails.send({
      from: 'Jonathan <jonathan@thetrusteconomy.org>',
      replyTo: 'jonathan@thetrusteconomy.org',
      to: email,
      subject: 'Welcome to Jett!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  
  <p>My name is Jonathan — I'm the creator of Jett.</p>
  
  <p>I built Jett because I believe designers shouldn't need to learn to code to bring their ideas to life. Just describe what you want, and Jett builds it for you.</p>
  
  <p>Here are 3 tips to get started:</p>
  
  <ol>
    <li><a href="https://github.com/jonathan-trustOS/jett-app/releases" style="color: #3b82f6;">Download Jett</a> — Get the latest version</li>
    <li><a href="https://jettbuilder.com/#how-it-works" style="color: #3b82f6;">Add your API key</a> — Bring your own Claude or OpenAI key</li>
    <li><a href="https://jettbuilder.com/#features" style="color: #3b82f6;">Start with an idea</a> — Describe your app and watch it build</li>
  </ol>
  
  <p><strong>P.S.: What are you hoping to build?</strong></p>
  
  <p>Hit "Reply" and let me know. I read and reply to every email.</p>
  
  <p>Cheers,<br>Jonathan</p>
</body>
</html>
      `,
      text: greeting + '\n\nMy name is Jonathan — I am the creator of Jett.\n\nI built Jett because I believe designers should not need to learn to code to bring their ideas to life. Just describe what you want, and Jett builds it for you.\n\nHere are 3 tips to get started:\n\n1. Download Jett — https://github.com/jonathan-trustOS/jett-app/releases\n2. Add your API key — https://jettbuilder.com/#how-it-works\n3. Start with an idea — https://jettbuilder.com/#features\n\nP.S.: What are you hoping to build?\n\nHit Reply and let me know. I read and reply to every email.\n\nCheers,\nJonathan'
    })

    if (error) {
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
