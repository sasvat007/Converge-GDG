package sasvar.example.chatbot.Database;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "project_team")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // reference to projects.id
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    // email of the teammate (links to JsonData.email / User.email)
    @Column(name = "member_email", nullable = false)
    private String memberEmail;

    // timestamp when member was added
    @Column(name = "added_at")
    private String addedAt = Instant.now().toString();
}
