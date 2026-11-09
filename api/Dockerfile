# Sonnaille API image (docs/deploiement-api.md). Built from the api/ folder:
#   docker build -t sonnaille-api api
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY nuget.config Directory.Build.props ./
COPY src/ src/
RUN dotnet publish src/Sonnaille.Api/Sonnaille.Api.csproj --configuration Release --output /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# Scaleway Serverless Containers send the requests to port 8080.
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
# Never as root.
USER $APP_UID
ENTRYPOINT ["dotnet", "Sonnaille.Api.dll"]
