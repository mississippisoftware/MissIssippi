use MissIssippiDB
go
create function dbo.fn_NormalizeSkuColor(@ColorName varchar(75))
returns varchar(75)
as
begin
    declare @result varchar(75) = '';
    declare @i int = 1;
    declare @len int = len(@ColorName);
    declare @ch char(1);
    declare @upper char(1);

    while @i <= @len
    begin
        set @ch = substring(@ColorName, @i, 1);
        set @upper = upper(@ch);

        if @upper collate Latin1_General_BIN like '[A-Z0-9]'
            and @upper not in ('A', 'E', 'I', 'O', 'U')
        begin
            set @result = @result + @upper;
        end

        set @i += 1;
    end

    return @result;
end
go
