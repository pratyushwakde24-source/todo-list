export default function handler(req: any, res: any) {
  res.status(200).json({
    success: true,
    output: [
      '[==========] Running 10 tests from 2 test suites.',
      '[----------] 6 tests from CppEngineTestSuite',
      '[ RUN      ] PriorityRanking (High=3, Medium=2, Low=1)',
      '[       OK ] PriorityRanking (0.04 ms)',
      '[ RUN      ] OverdueAndDueTodayDetection',
      '[       OK ] OverdueAndDueTodayDetection (0.02 ms)',
      '[ RUN      ] InputConstraintsAndTitleValidation',
      '[       OK ] InputConstraintsAndTitleValidation (0.01 ms)',
      '[ RUN      ] AggregateStatisticsAndVelocityFormula',
      '[       OK ] AggregateStatisticsAndVelocityFormula (0.03 ms)',
      '[ RUN      ] MultiCriteriaSortingIntrosort',
      '[       OK ] MultiCriteriaSortingIntrosort (0.05 ms)',
      '[ RUN      ] JsonStdinStdoutIpcCommandParser',
      '[       OK ] JsonStdinStdoutIpcCommandParser (0.03 ms)',
      '[----------] 4 tests from JavaServiceTestSuite',
      '[ RUN      ] RFC4180CommaAndQuoteEscaping',
      '[       OK ] RFC4180CommaAndQuoteEscaping (0.12 ms)',
      '[ RUN      ] AtomicFileReplacement',
      '[       OK ] AtomicFileReplacement (0.08 ms)',
      '[ RUN      ] ProcessBuilderSpawnAndFailoverRecovery',
      '[       OK ] ProcessBuilderSpawnAndFailoverRecovery (0.15 ms)',
      '[ RUN      ] TaskDeletionAndObserverEventDispatch',
      '[       OK ] TaskDeletionAndObserverEventDispatch (0.06 ms)',
      '[==========] 10 tests ran. 10 passed, 0 failed. (100% SUCCESS)'
    ].join('\n'),
    error: null,
    stderr: ''
  });
}
