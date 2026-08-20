# Converge-GDG

GDG Hackathon project.

## Project overview

Converge-GDG is a hackathon project built for the GDG community. The repository contains a TypeScript-based frontend and a Java-based backend. The application brings together (real-time) features and UI components to demonstrate an end-to-end solution.

Language composition (approximate):
- TypeScript (frontend)
- Java (backend)
- CSS

## Features
- Web frontend (TypeScript)
- Backend services (Java)
- Styling and responsive UI (CSS)

## Prerequisites
- Node.js (v16+ recommended) and npm or yarn
- Java JDK 11+ (or as required by the project)
- Maven or Gradle (if the Java backend uses one of them)
- Git

## Setup
1. Clone the repo:

   git clone https://github.com/sasvat007/Converge-GDG.git
   cd Converge-GDG

2. Frontend (TypeScript)
   - Navigate to the frontend directory (if present):

     cd frontend

   - Install dependencies:

     npm install
     # or
     yarn install

   - Start development server:

     npm run dev
     # or
     npm start

3. Backend (Java)
   - Navigate to the backend directory (if present):

     cd backend

   - Build and run with Maven:

     mvn clean package
     mvn spring-boot:run

     # or with Gradle
     ./gradlew bootRun

   - Ensure the backend is running on the configured port (e.g., http://localhost:8080)

4. Environment / configuration
   - If the project requires environment variables or configuration files, add them according to the code comments or configuration templates in the repository (e.g., `.env.example`, `application.properties`).

## Build for production
- Frontend: `npm run build` (or `yarn build`) — then serve the static build with your preferred static server or integrate with the backend.
- Backend: Package with Maven or Gradle and run the produced artifact.

## Running tests
- Run frontend tests (if any): `npm test` or `yarn test`
- Run backend tests: `mvn test` or `./gradlew test`

## Contributing
Contributions, issues, and feature requests are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add some feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request describing your changes

Please follow any existing code style and linting rules used in the project.

## License
This repository does not currently include a license file. If you are the owner, consider adding a LICENSE (e.g., MIT) to clarify usage rights.

## Contact
Project owner: @sasvat007

---

If you'd like, I can:
- Customize the README with exact project structure and commands after inspecting the repo files.
- Add a license file or CONTRIBUTING.md.
