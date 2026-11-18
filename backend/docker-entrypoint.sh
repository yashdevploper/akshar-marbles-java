#!/bin/sh
set -e

# Default PORT to 8080 if not assigned by Render
PORT="${PORT:-8080}"
echo "================================================="
echo "Starting Tomcat on 0.0.0.0:${PORT} for Render"
echo "================================================="

# Update Tomcat HTTP connector port and bind address in conf/server.xml
sed -i "s/port=\"8080\"/port=\"${PORT}\" address=\"0.0.0.0\"/g" /usr/local/tomcat/conf/server.xml

# Configure RemoteIpValve inside <Host> so Tomcat detects HTTPS forwarded by Render's reverse proxy
if ! grep -q "RemoteIpValve" /usr/local/tomcat/conf/server.xml; then
    sed -i '/<\/Host>/i \        <Valve className="org.apache.catalina.valves.RemoteIpValve" remoteIpHeader="x-forwarded-for" protocolHeader="x-forwarded-proto" />' /usr/local/tomcat/conf/server.xml
fi

# Execute Tomcat in foreground
exec catalina.sh run
