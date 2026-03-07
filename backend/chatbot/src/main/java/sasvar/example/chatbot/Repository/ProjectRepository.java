package sasvar.example.chatbot.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import sasvar.example.chatbot.Database.ProjectData;

public interface ProjectRepository extends JpaRepository<ProjectData, Long> {
  List<ProjectData> findAllByEmail(String email);

  List<ProjectData> findAllByVisibilityIgnoreCase(String visibility);
}
