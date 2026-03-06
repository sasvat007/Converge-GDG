package sasvar.example.chatbot.Repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import sasvar.example.chatbot.Database.User;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
}
