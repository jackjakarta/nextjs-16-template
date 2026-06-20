#!/bin/bash

pnpm checks && \
pnpm audit --audit-level=critical && \
pnpm build
