"""
app/repositories — data access layer package.

Repositories encapsulate all database queries.
They accept a SQLAlchemy Session and return ORM model instances.
No business logic should exist here — only query construction.
Repositories will be populated as features are built.
"""
