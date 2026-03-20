package sasvar.example.chatbot.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import sasvar.example.chatbot.Database.JsonData;
import sasvar.example.chatbot.Database.ProjectData;
import sasvar.example.chatbot.Exception.ProfileNotFoundException;
import sasvar.example.chatbot.Repository.JsonDataRepository;
import sasvar.example.chatbot.Repository.UserRepository;
import sasvar.example.chatbot.Database.User;
@Service
public class ChatBotService {

  private static final Logger log = LoggerFactory.getLogger(ChatBotService.class);

  private final JsonDataRepository jsonDataRepository;
  private final UserRepository userRepository;
  private final ObjectMapper mapper = new ObjectMapper();

  @Value("${gemini.api.key}")
  private String apiKey;

  private static final String GEMMA_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/"
          + "gemini-2.5-flash:generateContent?key=%s";

  public ChatBotService(JsonDataRepository jsonDataRepository, UserRepository userRepository) {
    this.jsonDataRepository = jsonDataRepository;
    this.userRepository = userRepository;
  }

  /* ------------------------------------------------------------------ */
  /* Resume → JSON via Gemini */
  /* ------------------------------------------------------------------ */

  public String convertJSON(String resumeText) {
    RestTemplate restTemplate = new RestTemplate();

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    String prompt =
        """
        You are an AI resume parser.

        Extract structured information from the resume text below.

        Rules:
        - Infer name, email, phone, skills, and education if clearly present.
        - Do NOT leave fields empty when information is visible.
        - Only leave fields empty if information is truly missing.
        - Return ONLY valid minified JSON.
        - Do NOT include explanations, markdown, or extra text.

        JSON Schema:
        {
          "profile": {
            "name": "",
            "year": "",
            "department": "",
            "availability": "low | medium | high"
          },
          "skills": {
            "programming_languages": [],
            "frameworks_libraries": [],
            "tools_platforms": [],
            "core_cs_concepts": [],
            "domain_skills": []
          },
          "experience_level": {
            "overall": "beginner | intermediate | advanced",
            "by_domain": {
              "web_dev": "beginner | intermediate | advanced",
              "ml_ai": "beginner | intermediate | advanced",
              "systems": "beginner | intermediate | advanced",
              "security": "beginner | intermediate | advanced"
            }
          },
          "projects": [
            {
              "title": "",
              "description": "",
              "technologies": [],
              "domain": "",
              "role": "",
              "completion_status": "completed | ongoing"
            }
          ],
          "interests": {
            "technical": [],
            "problem_domains": [],
            "learning_goals": []
          },
          "open_source": {
            "experience": "none | beginner | active | maintainer",
            "technologies": [],
            "contributions": 0
          },
          "achievements": {
            "hackathons": [],
            "certifications": [],
            "awards": []
          },
          "reputation_signals": {
            "completed_projects": 0,
            "average_rating": 0.0,
            "peer_endorsements": 0
          }
        }

        Resume Text:
        \\"\\"\\"  %s  \\"\\"\\"
        """
            .formatted(resumeText);

    // Proper escaping for the JSON request body
    String escapedPrompt = prompt.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");

    String body =
        """
        {
          "contents": [
            {
              "parts": [
                { "text": "%s" }
              ]
            }
          ]
        }
        """
            .formatted(escapedPrompt);

    HttpEntity<String> request = new HttpEntity<>(body, headers);

    // Retry with exponential backoff to handle Gemini rate limits
    int maxRetries = 3;
    long backoffMs = 2000; // start at 2 seconds

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log.info("Calling Gemini API to parse resume ({} chars, attempt {}/{})",
            resumeText.length(), attempt, maxRetries);
        ResponseEntity<String> response =
            restTemplate.postForEntity(String.format(GEMMA_URL, apiKey), request, String.class);

        log.info("Gemini API responded with status: {}", response.getStatusCode());
        String result = extractGeminiReply(response.getBody());

        // Validate JSON before returning
        mapper.readTree(result);
        log.info("Gemini resume parsing succeeded — {} chars of JSON", result.length());
        return result;

      } catch (Exception e) {
        log.warn("Gemini API attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
        if (attempt < maxRetries) {
          try {
            log.info("Retrying in {}ms...", backoffMs);
            Thread.sleep(backoffMs);
            backoffMs *= 2; // exponential backoff: 2s → 4s → 8s
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.error("Retry interrupted");
            return "{}";
          }
        } else {
          log.error("Gemini resume conversion FAILED after {} attempts: {}", maxRetries, e.getMessage(), e);
        }
      }
    }
    return "{}";
  }

  /* ------------------------------------------------------------------ */
  /* Save / Update profile */
  /* ------------------------------------------------------------------ */

  public JsonData saveJsonForEmail(
      String json,
      String email,
      String providedName,
      String providedYear,
      String providedDepartment,
      String providedInstitution,
      String providedAvailability,
      byte[] resumePdf) {

    if (email == null || email.isBlank()) {
      throw new RuntimeException("Email required to save profile");
    }

    String validJson = validateJson(json);

    log.warn(
        "[PDF-DEBUG] saveJsonForEmail called — json='{}', pdfBytes={}, email={}",
        json != null ? json.substring(0, Math.min(json.length(), 20)) : "null",
        resumePdf != null ? resumePdf.length + " bytes" : "null",
        email);

    // If no resume text was parsed (json is "{}") but a PDF was uploaded,
    // extract text from the PDF and run it through Gemini automatically.
    if ("{}".equals(validJson) && resumePdf != null && resumePdf.length > 0) {
      log.warn("[PDF-DEBUG] No resumeText provided — extracting text from PDF for {}", email);
      String pdfText = extractTextFromPdf(resumePdf);
      if (pdfText != null && !pdfText.isBlank()) {
        log.warn(
            "[PDF-DEBUG] Extracted {} chars from PDF, sending to Gemini for {}",
            pdfText.length(),
            email);
        validJson = validateJson(convertJSON(pdfText));
      } else {
        log.warn("[PDF-DEBUG] PDF text extraction returned blank for {}", email);
      }
    } else {
      log.warn(
          "[PDF-DEBUG] Skipped PDF extraction — validJson='{}', pdfNull={}",
          validJson.substring(0, Math.min(validJson.length(), 20)),
          resumePdf == null);
    }

    JsonData profile = jsonDataRepository.findByEmail(email).orElse(new JsonData());

    profile.setEmail(email);
    profile.setProfileJson(validJson);
    profile.setResumePdf(resumePdf);
    profile.setCreatedAt(Instant.now().toString());

    setIfPresent(providedName, profile::setName);
    setIfPresent(providedYear, profile::setYear);
    setIfPresent(providedDepartment, profile::setDepartment);
    setIfPresent(providedInstitution, profile::setInstitution);
    setIfPresent(providedAvailability, profile::setAvailability);

    fillMissingFromJson(profile, validJson);

    return jsonDataRepository.save(profile);
  }

  public JsonData updateResumeForEmail(String json, String email, byte[] resumePdf) {
    if (email == null || email.isBlank()) {
      throw new RuntimeException("Email required to update profile");
    }

    JsonData profile =
        jsonDataRepository
            .findByEmail(email)
            .orElseThrow(
                () -> new ProfileNotFoundException("Profile not found for email: " + email));

    String validJson = validateJson(json);

    // Auto-extract from PDF if no resume text was parsed
    if ("{}".equals(validJson) && resumePdf != null && resumePdf.length > 0) {
      log.info("No resumeText on update — extracting text from PDF for {}", email);
      String pdfText = extractTextFromPdf(resumePdf);
      if (pdfText != null && !pdfText.isBlank()) {
        validJson = validateJson(convertJSON(pdfText));
      }
    }

    profile.setProfileJson(validJson);
    if (resumePdf != null) {
      profile.setResumePdf(resumePdf);
    }
    profile.setCreatedAt(Instant.now().toString());

    return jsonDataRepository.save(profile);
  }

  /* ------------------------------------------------------------------ */
  /* Profile lookups */
  /* ------------------------------------------------------------------ */

  public JsonData getProfileByEmail(String email) {
    if (email == null) return null;
    return jsonDataRepository.findByEmail(email).orElse(null);
  }

  public JsonData getProfileForCurrentUser() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getName() == null) {
      throw new RuntimeException("User not authenticated — email is null");
    }
    return jsonDataRepository
        .findByEmail(auth.getName())
        .orElseThrow(() -> new ProfileNotFoundException("Profile not found for current user"));
  }

  public JsonData getProfileById(Long id) {
    if (id == null) return null;
    return jsonDataRepository.findById(id).orElse(null);
  }

  public Map<String, Object> getUserProfileById(Long id) {
    if (id == null) return null;

    Optional<JsonData> opt = jsonDataRepository.findById(id);
    if (opt.isEmpty()) return null;

    JsonData p = opt.get();
    Map<String, Object> profile = new HashMap<>();
    profile.put("email", p.getEmail());
    profile.put("name", p.getName());
    profile.put("year", p.getYear());
    profile.put("department", p.getDepartment());
    profile.put("institution", p.getInstitution());
    profile.put("availability", p.getAvailability());
    profile.put("Resume", p.getProfileJson());
    if (p.getResumePdf() != null) {
      profile.put("resumePdfUrl", "/api/resume/download/" + p.getId());
    }
    return profile;
  }

  /* ------------------------------------------------------------------ */
  /* Django ML integration (best-effort) */
  /* ------------------------------------------------------------------ */

  public void sendResumeJson(JsonData profile) {
    if (profile == null) return;

    String resumeJsonStr = profile.getProfileJson();
    if (resumeJsonStr == null || resumeJsonStr.isBlank()) return;

    try {
      JsonNode parsedJsonNode = mapper.readTree(resumeJsonStr);

      Map<String, Object> payload =
          profile.getId() != null
              ? Map.of("resume_id", profile.getId(), "resume_json", parsedJsonNode)
              : Map.of("parsed_json", parsedJsonNode);

      postToDjango("https://fundamentally-historiographic-leif.ngrok-free.dev/api/resume/json/", payload);

    } catch (Exception e) {
      log.warn("Failed to send resume JSON to Django ML service: {}", e.getMessage());
    }
  }

  /**
   * Calls the Django ML backend to get top-N suggested teammates for a project.
   * Enriches each match with user profile data from the database.
   */
  public List<Map<String, Object>> getSuggestedTeammates(Long projectId, int top) {
    List<Map<String, Object>> results = new ArrayList<>();

    try {
      String url = String.format(
          "https://fundamentally-historiographic-leif.ngrok-free.dev/api/project/match/%d/?top=%d",
          projectId, top);

      RestTemplate restTemplate = new RestTemplate();
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      // The ML endpoint is POST with an empty body
      HttpEntity<String> request = new HttpEntity<>("{}", headers);
      ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

      if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
        log.warn("ML match API returned {}: {}", response.getStatusCode(), response.getBody());
        return results;
      }

      JsonNode root = mapper.readTree(response.getBody());
      JsonNode matches = root.path("matches");

      if (!matches.isArray()) {
        log.warn("ML match API response has no 'matches' array");
        return results;
      }

      for (JsonNode match : matches) {
        long resumeId = match.path("resume_id").asLong();
        double finalScore = match.path("final_score").asDouble();

        // Extract sub-scores
        JsonNode layer1 = match.path("layer1_capability");
        double capabilityScore = layer1.path("capability_score").asDouble();

        JsonNode layer2 = match.path("layer2_trust");
        double trustScore = layer2.path("trust_score").asDouble();

        // Look up profile from DB
        Optional<JsonData> profileOpt = jsonDataRepository.findById(resumeId);
        if (profileOpt.isEmpty()) {
          log.debug("Skipping match resume_id={} — profile not found in DB", resumeId);
          continue;
        }

        JsonData p = profileOpt.get();

        // Admin users should not be suggested as teammates
        boolean isAdmin = userRepository.findByEmail(p.getEmail())
                                        .map(u -> "admin".equalsIgnoreCase(u.getRole()))
                                        .orElse(false);
        if (isAdmin) {
          log.debug("Skipping match resume_id={} — user is admin", resumeId);
          continue;
        }

        Map<String, Object> suggestion = new LinkedHashMap<>();
        suggestion.put("resumeId", resumeId);
        suggestion.put("email", p.getEmail());
        suggestion.put("name", p.getName());
        suggestion.put("department", p.getDepartment());
        suggestion.put("institution", p.getInstitution());
        suggestion.put("year", p.getYear());
        suggestion.put("availability", p.getAvailability());
        suggestion.put("finalScore", finalScore);
        suggestion.put("capabilityScore", capabilityScore);
        suggestion.put("trustScore", trustScore);

        results.add(suggestion);
      }

    } catch (Exception e) {
      log.warn("Failed to get teammate suggestions from ML service: {}", e.getMessage());
    }

    return results;
  }

  public void sendProjectAndOwnerResume(ProjectData project) {
    if (project == null) return;

    try {
      List<String> requiredSkillsList = csvToList(project.getRequiredSkills());
      List<String> domains = csvToList(project.getDomain());
      List<String> preferredTech = csvToList(project.getPreferredTechnologies());

      Map<String, Object> parsedJson =
          Map.of(
              "title",
              project.getTitle(),
              "description",
              project.getDescription() == null ? "" : project.getDescription(),
              "required_skills",
              requiredSkillsList,
              "preferred_technologies",
              preferredTech,
              "domains",
              domains,
              "project_type",
              project.getType(),
              "team_size",
              0,
              "created_at",
              project.getCreatedAt());

      Map<String, Object> payload =
          Map.of("project_id", project.getId(), "parsed_json", parsedJson);

      postToDjango("https://fundamentally-historiographic-leif.ngrok-free.dev/api/project/embed/", payload);

    } catch (Exception e) {
      log.warn("Failed to send project JSON to Django ML service: {}", e.getMessage());
    }
  }

  /* ================================================================== */
  /* Private helpers */
  /* ================================================================== */

  private String extractGeminiReply(String responseBody) {
    try {
      JsonNode root = mapper.readTree(responseBody);

      String text =
          root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

      if (text.startsWith("```json")) {
        text = text.substring(7, text.length() - 3);
      } else if (text.startsWith("```")) {
        text = text.substring(3, text.length() - 3);
      }
      return text.trim();

    } catch (Exception e) {
      throw new RuntimeException("Error parsing Gemini response", e);
    }
  }

  private String validateJson(String json) {
    if (json == null) return "{}";
    try {
      mapper.readTree(json);
      return json;
    } catch (Exception e) {
      log.warn("Invalid JSON received; falling back to empty object: {}", e.getMessage());
      return "{}";
    }
  }

  private void fillMissingFromJson(JsonData profile, String json) {
    try {
      JsonNode root = mapper.readTree(json);
      JsonNode profileNode = root.path("profile");
      if (profileNode.isMissingNode()) return;

      if (isBlank(profile.getName()) && profileNode.hasNonNull("name")) {
        profile.setName(profileNode.get("name").asText());
      }
      if (isBlank(profile.getYear()) && profileNode.hasNonNull("year")) {
        profile.setYear(profileNode.get("year").asText());
      }
      if (isBlank(profile.getDepartment()) && profileNode.hasNonNull("department")) {
        profile.setDepartment(profileNode.get("department").asText());
      }
      if (isBlank(profile.getInstitution()) && profileNode.hasNonNull("institution")) {
        profile.setInstitution(profileNode.get("institution").asText());
      }
      if (isBlank(profile.getAvailability()) && profileNode.hasNonNull("availability")) {
        profile.setAvailability(profileNode.get("availability").asText());
      }
    } catch (Exception e) {
      log.debug("Best-effort JSON profile extraction failed: {}", e.getMessage());
    }
  }

  private void postToDjango(String url, Map<String, Object> payload) throws Exception {
    String payloadStr = mapper.writeValueAsString(payload);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<String> request = new HttpEntity<>(payloadStr, headers);

    RestTemplate restTemplate = new RestTemplate();
    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

    if (!response.getStatusCode().is2xxSuccessful()) {
      log.warn("Django ML service returned {}: {}", response.getStatusCode(), response.getBody());
    }
  }

  private List<String> csvToList(String csv) {
    if (csv == null || csv.isBlank()) return List.of();
    return Arrays.stream(csv.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toList());
  }

  private void setIfPresent(String value, java.util.function.Consumer<String> setter) {
    if (value != null && !value.isBlank()) {
      setter.accept(value);
    }
  }

  private boolean isBlank(String s) {
    return s == null || s.isBlank();
  }

  /* ------------------------------------------------------------------ */
  /* PDF text extraction via Apache PDFBox                               */
  /* ------------------------------------------------------------------ */

  /**
   * Extracts plain text from PDF bytes using Apache PDFBox. Returns null (and logs a warning) if
   * extraction fails.
   */
  public String extractTextFromPdf(byte[] pdfBytes) {
    if (pdfBytes == null || pdfBytes.length == 0) return null;
    try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
      PDFTextStripper stripper = new PDFTextStripper();
      String text = stripper.getText(doc);
      return text == null ? null : text.trim();
    } catch (Exception e) {
      log.warn("PDF text extraction failed: {}", e.getMessage());
      return null;
    }
  }
}
