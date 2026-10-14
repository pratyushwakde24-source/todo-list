#include "../include/task_engine.h"
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <cctype>
#include <regex>

namespace taskflow {

namespace {

std::string toUpper(std::string s) {
    for (char& c : s) {
        c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
    }
    return s;
}

std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\r\n");
    return str.substr(first, (last - first + 1));
}

std::string escapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        switch (c) {
            case '"':  o << "\\\""; break;
            case '\\': o << "\\\\"; break;
            case '\b': o << "\\b";  break;
            case '\f': o << "\\f";  break;
            case '\n': o << "\\n";  break;
            case '\r': o << "\\r";  break;
            case '\t': o << "\\t";  break;
            default:
                if (static_cast<unsigned char>(c) <= 0x1f) {
                    o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
                } else {
                    o << c;
                }
        }
    }
    return o.str();
}

std::string extractString(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return "";
    pos = json.find(':', pos + needle.length());
    if (pos == std::string::npos) return "";
    pos = json.find_first_not_of(" \t\r\n", pos + 1);
    if (pos == std::string::npos || json[pos] != '"') return "";
    size_t end = pos + 1;
    std::string val;
    bool escaped = false;
    while (end < json.length()) {
        char c = json[end];
        if (escaped) {
            if (c == '"') val += '"';
            else if (c == '\\') val += '\\';
            else if (c == 'n') val += '\n';
            else if (c == 'r') val += '\r';
            else if (c == 't') val += '\t';
            else val += c;
            escaped = false;
        } else if (c == '\\') {
            escaped = true;
        } else if (c == '"') {
            break;
        } else {
            val += c;
        }
        end++;
    }
    return val;
}

bool extractBool(const std::string& json, const std::string& key, bool defaultVal = false) {
    std::string needle = "\"" + key + "\"";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return defaultVal;
    pos = json.find(':', pos + needle.length());
    if (pos == std::string::npos) return defaultVal;
    pos = json.find_first_not_of(" \t\r\n", pos + 1);
    if (pos == std::string::npos) return defaultVal;
    if (json.compare(pos, 4, "true") == 0) return true;
    if (json.compare(pos, 5, "false") == 0) return false;
    return defaultVal;
}

std::vector<std::string> splitObjects(const std::string& jsonArray) {
    std::vector<std::string> items;
    size_t pos = 0;
    while (pos < jsonArray.length()) {
        size_t start = jsonArray.find('{', pos);
        if (start == std::string::npos) break;
        int depth = 0;
        size_t end = start;
        bool inStr = false;
        bool esc = false;
        for (; end < jsonArray.length(); ++end) {
            char c = jsonArray[end];
            if (esc) {
                esc = false;
            } else if (c == '\\') {
                esc = true;
            } else if (c == '"') {
                inStr = !inStr;
            } else if (!inStr) {
                if (c == '{') depth++;
                else if (c == '}') {
                    depth--;
                    if (depth == 0) {
                        break;
                    }
                }
            }
        }
        if (depth == 0 && end < jsonArray.length()) {
            items.push_back(jsonArray.substr(start, end - start + 1));
            pos = end + 1;
        } else {
            break;
        }
    }
    return items;
}

Task parseTask(const std::string& json) {
    Task t;
    t.id = extractString(json, "id");
    t.title = extractString(json, "title");
    t.description = extractString(json, "description");
    t.category = extractString(json, "category");
    t.priority = extractString(json, "priority");
    t.dueDate = extractString(json, "dueDate");
    t.completed = extractBool(json, "completed");
    t.createdAt = extractString(json, "createdAt");
    return t;
}

std::vector<Task> parseTasksArray(const std::string& json) {
    std::vector<Task> tasks;
    size_t pos = json.find("\"tasks\"");
    if (pos == std::string::npos) return tasks;
    pos = json.find('[', pos);
    if (pos == std::string::npos) return tasks;
    size_t end = json.rfind(']');
    if (end == std::string::npos || end <= pos) return tasks;

    std::string arrayContent = json.substr(pos, end - pos + 1);
    std::vector<std::string> objs = splitObjects(arrayContent);
    for (const auto& obj : objs) {
        tasks.push_back(parseTask(obj));
    }
    return tasks;
}

std::string taskToJson(const Task& t) {
    std::ostringstream oss;
    oss << "{"
        << "\"id\":\"" << escapeJson(t.id) << "\","
        << "\"title\":\"" << escapeJson(t.title) << "\","
        << "\"description\":\"" << escapeJson(t.description) << "\","
        << "\"category\":\"" << escapeJson(t.category) << "\","
        << "\"priority\":\"" << escapeJson(t.priority) << "\","
        << "\"dueDate\":\"" << escapeJson(t.dueDate) << "\","
        << "\"completed\":" << (t.completed ? "true" : "false") << ","
        << "\"createdAt\":\"" << escapeJson(t.createdAt) << "\""
        << "}";
    return oss.str();
}

} // namespace

int TaskEngine::priorityRank(const std::string& priority) {
    std::string p = toUpper(trim(priority));
    if (p == "HIGH") return 3;
    if (p == "MEDIUM" || p == "MED") return 2;
    if (p == "LOW") return 1;
    return 0;
}

bool TaskEngine::isOverdue(const Task& task, const std::string& todayDate) {
    if (task.completed || task.dueDate.empty() || todayDate.empty()) {
        return false;
    }
    // Lexicographical comparison for YYYY-MM-DD format
    return task.dueDate < todayDate;
}

bool TaskEngine::isDueToday(const Task& task, const std::string& todayDate) {
    if (task.completed || task.dueDate.empty() || todayDate.empty()) {
        return false;
    }
    return task.dueDate == todayDate;
}

bool TaskEngine::validateTask(const Task& task, std::vector<std::string>& outErrors) {
    outErrors.clear();
    std::string trimmedTitle = trim(task.title);
    if (trimmedTitle.empty()) {
        outErrors.push_back("Task title is required and cannot be blank.");
    } else if (trimmedTitle.length() > 150) {
        outErrors.push_back("Task title must be 150 characters or fewer.");
    }

    if (!task.dueDate.empty()) {
        std::regex datePattern("^\\d{4}-\\d{2}-\\d{2}$");
        if (!std::regex_match(task.dueDate, datePattern)) {
            outErrors.push_back("Due date must be in YYYY-MM-DD format.");
        }
    }

    std::string p = toUpper(trim(task.priority));
    if (!p.empty() && p != "HIGH" && p != "MEDIUM" && p != "LOW") {
        outErrors.push_back("Priority must be High, Medium, or Low.");
    }

    return outErrors.empty();
}

Statistics TaskEngine::calculateStatistics(const std::vector<Task>& tasks, const std::string& todayDate) {
    Statistics stats;
    stats.totalTasks = static_cast<int>(tasks.size());

    for (const auto& task : tasks) {
        if (task.completed) {
            stats.completedTasks++;
        } else {
            stats.pendingTasks++;
            if (priorityRank(task.priority) == 3) {
                stats.highPriorityPending++;
            }
            if (isOverdue(task, todayDate)) {
                stats.overdueTasks++;
            }
            if (isDueToday(task, todayDate)) {
                stats.dueTodayTasks++;
            }
        }
    }

    if (stats.totalTasks > 0) {
        stats.completionPercentage = (static_cast<double>(stats.completedTasks) / stats.totalTasks) * 100.0;
    } else {
        stats.completionPercentage = 0.0;
    }

    return stats;
}

std::vector<Task> TaskEngine::filterTasks(const std::vector<Task>& tasks, const FilterCriteria& criteria, const std::string& todayDate) {
    std::vector<Task> result;
    std::string catFilter = toUpper(trim(criteria.category));
    std::string priFilter = toUpper(trim(criteria.priority));
    std::string statFilter = toUpper(trim(criteria.status));
    std::string query = toUpper(trim(criteria.searchQuery));

    for (const auto& task : tasks) {
        // Category check
        if (!catFilter.empty() && catFilter != "ALL") {
            if (toUpper(trim(task.category)) != catFilter) {
                continue;
            }
        }

        // Priority check
        if (!priFilter.empty() && priFilter != "ALL") {
            if (toUpper(trim(task.priority)) != priFilter) {
                continue;
            }
        }

        // Status check
        if (!statFilter.empty() && statFilter != "ALL") {
            if (statFilter == "COMPLETED" && !task.completed) continue;
            if (statFilter == "PENDING" && task.completed) continue;
            if (statFilter == "OVERDUE" && !isOverdue(task, todayDate)) continue;
            if (statFilter == "DUE_TODAY" && !isDueToday(task, todayDate)) continue;
        }

        // Search query (title or description)
        if (!query.empty()) {
            std::string t = toUpper(task.title);
            std::string d = toUpper(task.description);
            if (t.find(query) == std::string::npos && d.find(query) == std::string::npos) {
                continue;
            }
        }

        result.push_back(task);
    }

    return result;
}

void TaskEngine::sortTasks(std::vector<Task>& tasks, SortCriteria sort) {
    switch (sort) {
        case SortCriteria::DUE_DATE_ASC:
            std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
                if (a.dueDate.empty() && b.dueDate.empty()) return a.createdAt > b.createdAt;
                if (a.dueDate.empty()) return false; // empty due dates push to end
                if (b.dueDate.empty()) return true;
                return a.dueDate < b.dueDate;
            });
            break;
        case SortCriteria::DUE_DATE_DESC:
            std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
                if (a.dueDate.empty() && b.dueDate.empty()) return a.createdAt > b.createdAt;
                if (a.dueDate.empty()) return false;
                if (b.dueDate.empty()) return true;
                return a.dueDate > b.dueDate;
            });
            break;
        case SortCriteria::PRIORITY_DESC:
            std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
                int rA = priorityRank(a.priority);
                int rB = priorityRank(b.priority);
                if (rA != rB) return rA > rB;
                return a.dueDate < b.dueDate;
            });
            break;
        case SortCriteria::PRIORITY_ASC:
            std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
                int rA = priorityRank(a.priority);
                int rB = priorityRank(b.priority);
                if (rA != rB) return rA < rB;
                return a.dueDate < b.dueDate;
            });
            break;
        case SortCriteria::TITLE_ASC:
            std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
                return toUpper(a.title) < toUpper(b.title);
            });
            break;
        case SortCriteria::CREATED_AT_DESC:
        default:
            std::sort(tasks.begin(), tasks.end(), [](const Task& a, const Task& b) {
                return a.createdAt > b.createdAt;
            });
            break;
    }
}

std::string TaskEngine::processJsonCommand(const std::string& jsonInput) {
    std::string action = toUpper(extractString(jsonInput, "action"));
    if (action.empty()) action = "PING";

    if (action == "PING") {
        return "{\"status\":\"OK\",\"message\":\"TaskFlow C++ Engine 1.0 Ready\",\"engine\":\"C++17 Standalone IPC\"}";
    }

    std::string today = extractString(jsonInput, "today");
    if (today.empty()) today = "2026-10-14";

    if (action == "VALIDATE") {
        Task t = parseTask(jsonInput);
        std::vector<std::string> errors;
        bool ok = validateTask(t, errors);
        std::ostringstream oss;
        oss << "{\"status\":\"OK\",\"valid\":" << (ok ? "true" : "false") << ",\"errors\":[";
        for (size_t i = 0; i < errors.size(); ++i) {
            oss << "\"" << escapeJson(errors[i]) << "\"";
            if (i + 1 < errors.size()) oss << ",";
        }
        oss << "]}";
        return oss.str();
    }

    std::vector<Task> tasks = parseTasksArray(jsonInput);

    if (action == "STATISTICS") {
        Statistics s = calculateStatistics(tasks, today);
        std::ostringstream oss;
        oss << "{\"status\":\"OK\",\"stats\":{"
            << "\"totalTasks\":" << s.totalTasks << ","
            << "\"completedTasks\":" << s.completedTasks << ","
            << "\"pendingTasks\":" << s.pendingTasks << ","
            << "\"overdueTasks\":" << s.overdueTasks << ","
            << "\"dueTodayTasks\":" << s.dueTodayTasks << ","
            << "\"highPriorityPending\":" << s.highPriorityPending << ","
            << std::fixed << std::setprecision(1)
            << "\"completionPercentage\":" << s.completionPercentage
            << "}}";
        return oss.str();
    }

    if (action == "FILTER_AND_SORT" || action == "PROCESS") {
        FilterCriteria criteria;
        criteria.category = extractString(jsonInput, "category");
        criteria.priority = extractString(jsonInput, "priority");
        criteria.status = extractString(jsonInput, "status");
        criteria.searchQuery = extractString(jsonInput, "searchQuery");

        std::string sortStr = toUpper(extractString(jsonInput, "sort"));
        SortCriteria sort = SortCriteria::CREATED_AT_DESC;
        if (sortStr == "DUE_DATE_ASC") sort = SortCriteria::DUE_DATE_ASC;
        else if (sortStr == "DUE_DATE_DESC") sort = SortCriteria::DUE_DATE_DESC;
        else if (sortStr == "PRIORITY_DESC") sort = SortCriteria::PRIORITY_DESC;
        else if (sortStr == "PRIORITY_ASC") sort = SortCriteria::PRIORITY_ASC;
        else if (sortStr == "TITLE_ASC") sort = SortCriteria::TITLE_ASC;

        std::vector<Task> filtered = filterTasks(tasks, criteria, today);
        sortTasks(filtered, sort);
        Statistics s = calculateStatistics(tasks, today);

        std::ostringstream oss;
        oss << "{\"status\":\"OK\","
            << "\"stats\":{"
            << "\"totalTasks\":" << s.totalTasks << ","
            << "\"completedTasks\":" << s.completedTasks << ","
            << "\"pendingTasks\":" << s.pendingTasks << ","
            << "\"overdueTasks\":" << s.overdueTasks << ","
            << "\"dueTodayTasks\":" << s.dueTodayTasks << ","
            << "\"highPriorityPending\":" << s.highPriorityPending << ","
            << std::fixed << std::setprecision(1)
            << "\"completionPercentage\":" << s.completionPercentage
            << "},"
            << "\"count\":" << filtered.size() << ","
            << "\"tasks\":[";

        for (size_t i = 0; i < filtered.size(); ++i) {
            oss << taskToJson(filtered[i]);
            if (i + 1 < filtered.size()) oss << ",";
        }
        oss << "]}";
        return oss.str();
    }

    return "{\"status\":\"ERROR\",\"message\":\"Unknown action: " + escapeJson(action) + "\"}";
}

} // namespace taskflow
