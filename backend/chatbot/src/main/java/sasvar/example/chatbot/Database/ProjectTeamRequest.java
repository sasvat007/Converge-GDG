package sasvar.example.chatbot.Database;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "project_team_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTeamRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    // NEW: Title of the project for display in notifications
    @Column(name = "project_title")
    private String projectTitle;

    // email of the user who initiated the request (project owner)
    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    // email of the candidate (must accept)
    @Column(name = "target_email", nullable = false)
    private String targetEmail;

    // PENDING | ACCEPTED | REJECTED
    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    // NEW: Type of request: JOIN_REQUEST | RATING_REQUEST
    @Column(name = "type")
    private String type = "JOIN_REQUEST";

    // NEW: For RATING_REQUEST, the email of the user to be rated
    @Column(name = "ratee_email")
    private String rateeEmail;

    // NEW: For RATING_REQUEST, the name of the user to be rated
    @Column(name = "ratee_name")
    private String rateeName;

    @Column(name = "created_at")
    private String createdAt = Instant.now().toString();

    @Column(name = "updated_at")
    private String updatedAt = Instant.now().toString();
}
