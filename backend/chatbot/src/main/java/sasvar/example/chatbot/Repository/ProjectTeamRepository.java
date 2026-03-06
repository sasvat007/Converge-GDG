package sasvar.example.chatbot.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import sasvar.example.chatbot.Database.ProjectTeam;

public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, Long> {
  List<ProjectTeam> findAllByProjectId(Long projectId);

  Optional<ProjectTeam> findByProjectIdAndMemberEmail(Long projectId, String memberEmail);

  boolean existsByProjectIdAndMemberEmail(Long projectId, String memberEmail);

  List<ProjectTeam> findAllByMemberEmail(String memberEmail);
}
