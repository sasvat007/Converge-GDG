package sasvar.example.chatbot.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sasvar.example.chatbot.Database.ProjectTeamRequest;

import java.util.List;
import java.util.Optional;

public interface ProjectTeamRequestRepository extends JpaRepository<ProjectTeamRequest, Long> {
    List<ProjectTeamRequest> findByTargetEmailAndStatus(String targetEmail, String status);
    List<ProjectTeamRequest> findAllByTargetEmail(String targetEmail);
    Optional<ProjectTeamRequest> findByProjectIdAndTargetEmailAndStatus(Long projectId, String targetEmail, String status);
}
