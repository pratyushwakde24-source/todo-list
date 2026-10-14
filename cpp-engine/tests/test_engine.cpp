#include "../include/task_engine.h"
#include <iostream>
#include <cassert>
#include <vector>

void testPriorityRanking() {
    std::cout << "[Test] Priority Ranking: ";
    assert(taskflow::TaskEngine::priorityRank("High") == 3);
    assert(taskflow::TaskEngine::priorityRank("HIGH") == 3);
    assert(taskflow::TaskEngine::priorityRank("Medium") == 2);
    assert(taskflow::TaskEngine::priorityRank("Low") == 1);
    assert(taskflow::TaskEngine::priorityRank("Unknown") == 0);
    std::cout << "PASSED\n";
}

void testOverdueDetection() {
    std::cout << "[Test] Overdue & Due Today Detection: ";
    taskflow::Task t1;
    t1.dueDate = "2026-10-10";
    t1.completed = false;
    assert(taskflow::TaskEngine::isOverdue(t1, "2026-10-14") == true);

    taskflow::Task t2;
    t2.dueDate = "2026-10-14";
    t2.completed = false;
    assert(taskflow::TaskEngine::isDueToday(t2, "2026-10-14") == true);
    assert(taskflow::TaskEngine::isOverdue(t2, "2026-10-14") == false);

    taskflow::Task t3;
    t3.dueDate = "2026-10-20";
    t3.completed = false;
    assert(taskflow::TaskEngine::isOverdue(t3, "2026-10-14") == false);

    taskflow::Task t4;
    t4.dueDate = "2026-10-10";
    t4.completed = true; // completed tasks are never flagged overdue
    assert(taskflow::TaskEngine::isOverdue(t4, "2026-10-14") == false);

    std::cout << "PASSED\n";
}

void testValidation() {
    std::cout << "[Test] Validation Logic: ";
    taskflow::Task invalidTask;
    invalidTask.title = "   "; // blank
    std::vector<std::string> errors;
    bool ok = taskflow::TaskEngine::validateTask(invalidTask, errors);
    assert(!ok);
    assert(!errors.empty());

    taskflow::Task validTask;
    validTask.title = "Complete Data Structures Assignment";
    validTask.priority = "High";
    validTask.dueDate = "2026-10-18";
    errors.clear();
    ok = taskflow::TaskEngine::validateTask(validTask, errors);
    assert(ok);
    assert(errors.empty());
    std::cout << "PASSED\n";
}

void testStatistics() {
    std::cout << "[Test] Aggregate Statistics: ";
    std::vector<taskflow::Task> tasks;
    
    taskflow::Task t1; t1.completed = true;
    taskflow::Task t2; t2.completed = false; t2.priority = "High"; t2.dueDate = "2026-10-10"; // overdue
    taskflow::Task t3; t3.completed = false; t3.priority = "Medium"; t3.dueDate = "2026-10-14"; // due today
    taskflow::Task t4; t4.completed = false; t4.priority = "Low"; t4.dueDate = "2026-10-25";

    tasks.push_back(t1);
    tasks.push_back(t2);
    tasks.push_back(t3);
    tasks.push_back(t4);

    taskflow::Statistics s = taskflow::TaskEngine::calculateStatistics(tasks, "2026-10-14");
    assert(s.totalTasks == 4);
    assert(s.completedTasks == 1);
    assert(s.pendingTasks == 3);
    assert(s.overdueTasks == 1);
    assert(s.dueTodayTasks == 1);
    assert(s.highPriorityPending == 1);
    assert(s.completionPercentage == 25.0);
    std::cout << "PASSED\n";
}

void testSortingAndFiltering() {
    std::cout << "[Test] Sorting and Filtering: ";
    std::vector<taskflow::Task> tasks;
    taskflow::Task t1; t1.title = "Task C"; t1.priority = "Low"; t1.dueDate = "2026-10-25"; t1.category = "College";
    taskflow::Task t2; t2.title = "Task A"; t2.priority = "High"; t2.dueDate = "2026-10-12"; t2.category = "Work";
    taskflow::Task t3; t3.title = "Task B"; t3.priority = "Medium"; t3.dueDate = "2026-10-18"; t3.category = "College";

    tasks.push_back(t1);
    tasks.push_back(t2);
    tasks.push_back(t3);

    // Sort by priority desc
    std::vector<taskflow::Task> copyTasks = tasks;
    taskflow::TaskEngine::sortTasks(copyTasks, taskflow::SortCriteria::PRIORITY_DESC);
    assert(copyTasks[0].priority == "High");
    assert(copyTasks[1].priority == "Medium");
    assert(copyTasks[2].priority == "Low");

    // Filter by category
    taskflow::FilterCriteria criteria;
    criteria.category = "College";
    std::vector<taskflow::Task> filtered = taskflow::TaskEngine::filterTasks(tasks, criteria, "2026-10-14");
    assert(filtered.size() == 2);
    std::cout << "PASSED\n";
}

void testJsonIpc() {
    std::cout << "[Test] JSON IPC Command Parser: ";
    std::string pingResp = taskflow::TaskEngine::processJsonCommand("{\"action\":\"PING\"}");
    assert(pingResp.find("\"status\":\"OK\"") != std::string::npos);

    std::string jsonCmd = "{\"action\":\"STATISTICS\",\"today\":\"2026-10-14\",\"tasks\":[{\"id\":\"1\",\"title\":\"Test Task\",\"description\":\"Notes\",\"category\":\"College\",\"priority\":\"High\",\"dueDate\":\"2026-10-12\",\"completed\":false,\"createdAt\":\"2026-10-14T10:00:00\"}]}";
    std::string statResp = taskflow::TaskEngine::processJsonCommand(jsonCmd);
    assert(statResp.find("\"overdueTasks\":1") != std::string::npos);
    assert(statResp.find("\"totalTasks\":1") != std::string::npos);
    std::cout << "PASSED\n";
}

int main() {
    std::cout << "=== Running TaskFlow C++ Engine Test Suite ===\n";
    testPriorityRanking();
    testOverdueDetection();
    testValidation();
    testStatistics();
    testSortingAndFiltering();
    testJsonIpc();
    std::cout << "=== ALL C++ ENGINE TESTS PASSED SUCCESSFULLY! ===\n";
    return 0;
}
