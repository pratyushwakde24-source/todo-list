#ifndef TASK_ENGINE_H
#define TASK_ENGINE_H

#include <string>
#include <vector>
#include <map>

namespace taskflow {

struct Task {
    std::string id;
    std::string title;
    std::string description;
    std::string category;
    std::string priority;
    std::string dueDate;
    bool completed = false;
    std::string createdAt;
};

struct FilterCriteria {
    std::string category = "ALL";
    std::string priority = "ALL";
    std::string status = "ALL"; // ALL, COMPLETED, PENDING, OVERDUE, DUE_TODAY
    std::string searchQuery = "";
};

enum class SortCriteria {
    DUE_DATE_ASC,
    DUE_DATE_DESC,
    PRIORITY_DESC,
    PRIORITY_ASC,
    CREATED_AT_DESC,
    TITLE_ASC
};

struct Statistics {
    int totalTasks = 0;
    int completedTasks = 0;
    int pendingTasks = 0;
    int overdueTasks = 0;
    int dueTodayTasks = 0;
    int highPriorityPending = 0;
    double completionPercentage = 0.0;
};

class TaskEngine {
public:
    static int priorityRank(const std::string& priority);
    static bool isOverdue(const Task& task, const std::string& todayDate);
    static bool isDueToday(const Task& task, const std::string& todayDate);
    static bool validateTask(const Task& task, std::vector<std::string>& outErrors);
    
    static Statistics calculateStatistics(const std::vector<Task>& tasks, const std::string& todayDate);
    static std::vector<Task> filterTasks(const std::vector<Task>& tasks, const FilterCriteria& criteria, const std::string& todayDate);
    static void sortTasks(std::vector<Task>& tasks, SortCriteria sort);

    // JSON IPC Helper methods
    static std::string processJsonCommand(const std::string& jsonInput);
};

} // namespace taskflow

#endif // TASK_ENGINE_H
