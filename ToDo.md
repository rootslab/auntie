>__MISSING__:
  
  - #dist:
    - re-implement the complex mode in a efficient way (memory/time/ops)
    - write (deep) tests for complex mode.
    - implement the naive mode for #dist method (single byte sequence)
    - fix naive mode relative benchmark.
    - write tests for naive mode.
  
  - #do, #count:
    - write tests for the current implementation of the naive mode.

>__TODO__:

  - Buffering. An example scenario: no match for several chunks, the snip will
    become very large. we could collect multiple buffers which don't contain
    the sequence, therefore delaying the data concatenation; however, for now,
    we concat only the previous chunk of data with the current, the tonto way.
  
  - ..