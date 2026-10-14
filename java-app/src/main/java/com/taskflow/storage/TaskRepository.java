package com.taskflow.storage;

import com.taskflow.model.Task;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface TaskRepository {
    List<Task> findAll() throws IOException;
    Optional<Task> findById(String id) throws IOException;
    void save(Task task) throws IOException;
    void saveAll(List<Task> tasks) throws IOException;
    boolean deleteById(String id) throws IOException;
    void deleteAll() throws IOException;
}
