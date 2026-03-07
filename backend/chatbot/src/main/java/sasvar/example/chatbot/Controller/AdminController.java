package sasvar.example.chatbot.Controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sasvar.example.chatbot.Database.JsonData;
import sasvar.example.chatbot.Repository.JsonDataRepository;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin-only endpoints (requires ROLE_ADMIN)")
public class AdminController {

  private static final Logger log = LoggerFactory.getLogger(AdminController.class);

  private final JsonDataRepository jsonDataRepository;

  public AdminController(JsonDataRepository jsonDataRepository) {
    this.jsonDataRepository = jsonDataRepository;
  }

  /* ------------------------------------------------------------------ */
  /* GET /api/admin/resumes/download-all                                */
  /* ------------------------------------------------------------------ */

  @Operation(
      summary = "Download all uploaded resumes as a ZIP",
      description =
          """
          Fetches every resume PDF stored in the database and bundles them
          into a single ZIP archive. Each file is named resume_<email>.pdf.
          Requires ADMIN role.""")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "ZIP archive of all resume PDFs",
        content = @Content(mediaType = "application/zip")),
    @ApiResponse(responseCode = "403", description = "Forbidden – requires ADMIN role"),
    @ApiResponse(responseCode = "404", description = "No resumes found"),
    @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/resumes/download-all")
  public ResponseEntity<?> downloadAllResumes() throws IOException {

    List<JsonData> allProfiles = jsonDataRepository.findAll();

    // Filter to only those with a non-null resumePdf
    List<JsonData> withPdf =
        allProfiles.stream().filter(p -> p.getResumePdf() != null).toList();

    if (withPdf.isEmpty()) {
      return ResponseEntity.status(404)
          .body(java.util.Map.of("message", "No resume PDFs found in the database"));
    }

    log.info("Admin downloading {} resume PDFs", withPdf.size());

    // Build ZIP in memory
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      for (JsonData profile : withPdf) {
        String filename = sanitizeFilename(profile.getEmail()) + ".pdf";
        ZipEntry entry = new ZipEntry(filename);
        zos.putNextEntry(entry);
        zos.write(profile.getResumePdf());
        zos.closeEntry();
      }
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("application/zip"));
    headers.setContentDispositionFormData("attachment", "all_resumes.zip");
    headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

    return ResponseEntity.ok().headers(headers).body(baos.toByteArray());
  }

  /**
   * Sanitise an email address for use as a filename.
   * Replaces @ and dots to produce something like "user_example_com".
   */
  private String sanitizeFilename(String email) {
    if (email == null || email.isBlank()) {
      return "unknown";
    }
    return email.replaceAll("[^a-zA-Z0-9._-]", "_");
  }
}
