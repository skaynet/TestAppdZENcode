# Dockerfile для WebApi
# Stage 1: Restore and Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TestAppdZENcode.Server.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
ENV ASPNETCORE_URLS=http://+:7005
WORKDIR /app
COPY --from=build /app .
EXPOSE 7005
ENTRYPOINT ["dotnet", "TestAppdZENcode.Server.dll"]