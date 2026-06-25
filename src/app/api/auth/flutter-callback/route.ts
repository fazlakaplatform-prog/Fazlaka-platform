import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { signToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.email) {
    return new Response(
      `<script>
if(window.opener){
  window.opener.postMessage({type:'GOOGLE_AUTH_ERROR',error:'NoSession'},'*');
  window.close()
}else{document.write('Not authenticated')}
</script>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const userData = {
    id: token.sub,
    name: token.name,
    email: token.email,
    image: token.picture,
    role: token.role,
  };

  // Generate our app JWT for the Flutter app
  const appJwt = signToken({ userId: token.sub! });

  return new Response(
    `<script>
if(window.opener){
  window.opener.postMessage({
    type:'GOOGLE_AUTH_SUCCESS',
    token:'${appJwt}',
    user: ${JSON.stringify(userData)}
  },'*');
  window.close()
}else{document.write('Signed in! You can close this window.')}
</script>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
